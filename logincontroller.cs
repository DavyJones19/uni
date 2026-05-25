using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using WebBACK.Data;
using WebBACK.Models;
using System.Data;
using Microsoft.AspNetCore.Authorization;
using System.Security.Cryptography;
using System.Text;
using System.Linq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebBACK_2026.Services;

namespace MiWebAPI.Controllers
{
    [AllowAnonymous]
    [Route("api/[controller]")]
    [EnableCors("PermitirOrigenLocalhost3000")]
    public class LoginController : Controller
    {
        private readonly IConfiguration _config;
        private readonly DatabaseLogin _db;
        private readonly TokenService _tokenService;

        public LoginController(IConfiguration configuration, TokenService tokenService)
        {
            _config = configuration;
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            _db = new DatabaseLogin(connectionString);
            _tokenService = tokenService;
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Login nuevoLogin)
        {
            try
            {
                // 1. Buscamos al usuario por su identificador en DHL_USERS
                var parametros = new Dictionary<string, object>
                {
                    { "@Usuario", nuevoLogin.Usuario }
                };

                var result = await _db.ExecuteStoredProcedureAsync("ObtenerUsuarioPorLogin", parametros);

                if (result == null || result.Count == 0)
                {
                    return Unauthorized(new { error = "Usuario o contraseña incorrectos" });
                }

                var fila = result[0];

                // Mapeo dinamico de llaves para evitar fallas por mayusculas o minusculas
                string llaveId = fila.ContainsKey("id") ? "id" : (fila.ContainsKey("ID") ? "ID" : null);
                string llavePwd = fila.ContainsKey("pwd") ? "pwd" : (fila.ContainsKey("PWD") ? "PWD" : null);

                if (llaveId == null || llavePwd == null)
                {
                    return StatusCode(500, new { error = "Error interno: Columnas del SP no coinciden." });
                }

                int userId = Convert.ToInt32(fila[llaveId]);
                string hashedPasswordInDb = Convert.ToString(fila[llavePwd]).Trim();

                // 2. VERIFICACION CRITICA CON BCRYPT
                bool isPasswordValid = BCrypt.Net.BCrypt.Verify(nuevoLogin.Pwd, hashedPasswordInDb);

                if (!isPasswordValid)
                {
                    return Unauthorized(new { error = "Usuario o contraseña incorrectos" });
                }

                // 3. Emitir token (Tu flujo original)
                var token = await _tokenService.EmitirTokenAsync(
                    userId,
                    HttpContext.Connection.RemoteIpAddress?.ToString(),
                    HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Request.Headers["User-Agent"].ToString(),
                    "WEB"
                );

                // 4. Responder con exito
                return Ok(new { userId, token });
            }
            catch (Exception exGeneral)
            {
                return StatusCode(500, new { error = "Error interno en el servidor.", detalle = exGeneral.Message });
            }
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var token = Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");

            if (string.IsNullOrEmpty(token))
                return BadRequest();

            string tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

            await _db.ExecuteStoredProcedureAsync("sp_API_Logout", new Dictionary<string, object>
            {
                { "@TokenHash", tokenHash }
            });

            return Ok();
        }

        [AllowAnonymous]
        [HttpPost("whatsapp")]
        public async Task<IActionResult> LoginWhatsApp([FromBody] WhatsAppLoginRequest request)
        {
            var validKey = _config["WhatsAppAuth:ApiKey"];

            if (request.ApiKey != validKey)
                return Unauthorized("ApiKey invalida");

            string telefono = new string(request.Telefono.Where(char.IsDigit).ToArray());

            var parametros = new Dictionary<string, object>
            {
                { "@telefono", telefono }
            };

            var result = await _db.ExecuteStoredProcedureAsync("sp_API_BuscarUsuarioPorTelefono", parametros);

            if (result == null || result.Count == 0)
                return Unauthorized("Telefono no registrado");

            int userId = Convert.ToInt32(result[0]["UserId"]);
            string nombre = Convert.ToString(result[0]["nombre"]);

            var token = await _tokenService.EmitirTokenAsync(userId, telefono, HttpContext.Connection.RemoteIpAddress?.ToString(), "", "WHATSAPP");

            return Ok(new { userId, nombre, token });
        }
    }

    public class WhatsAppLoginRequest
    {
        public string Telefono { get; set; }
        public string ApiKey { get; set; }
    }
}
