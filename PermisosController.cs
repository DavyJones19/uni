using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using System.Reflection;
using System.Security.Claims;
using WebBACK.Data;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Text.Json;
using WebBACK.Models;
using System.Data.SqlClient;
using System.Data;
using System.Text.Json.Nodes;
using System.Runtime.CompilerServices;
using WebBACK_2026.Services.PDF;
using WebBACK_2026.Services;
using System.Text.Encodings.Web;
using System.Text.Unicode;
using System.IO.Compression;

namespace WebBACK_2026.Controllers
{
    //[AllowAnonymous]
    [ApiController]
    [Authorize]
    [Route("permisos")]
    [EnableCors("PermitirOrigenLocalhost3000")] // Aplica la política
    
    public class PermisosController : ControllerBase
    {
        private readonly DatabaseHelper _db;
        private readonly PermisosPdfService _permisosPdfService;
        private readonly PermisosCorreoService _permisosCorreoService;
        private string role = "1";
        private int GetUserId()
        {
            var claim = User.FindFirst("id_user");

            if (claim == null)
                throw new UnauthorizedAccessException("Token inválido o no presente");

            return int.Parse(claim.Value);
        }

        public PermisosController(IConfiguration configuration, PermisosPdfService permisosPdfService, PermisosCorreoService permisosCorreoService)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            _db = new DatabaseHelper(connectionString);
            _permisosPdfService = permisosPdfService;
            _permisosCorreoService = permisosCorreoService;
        }
        [HttpGet("calendario")]
        public async Task<IActionResult> GetCalendario([FromQuery] int desde,[FromQuery] int hasta)
        {
            // 🔐 obtener UserId desde JWT
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int userId = GetUserId();
           // if (!int.TryParse(userIdClaim, out var userId))
             //   return Unauthorized("UserId inválido");

            var parametros = new Dictionary<string, object>
            {
                ["@UserId"] = userId,
                ["@AnioMesDesde"] = desde,
                ["@AnioMesHasta"] = hasta
            };

            var data = await _db.ExecuteStoredProcedureAsync("dbo.sp_API_Configuracion_Obtener",parametros);

            return Ok(data);
        }
        [HttpGet("catalogo")]
        public async Task<IActionResult> GetCatalogo()
        {
            // 🔐 obtener UserId desde JWT
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int userId = GetUserId();
            // if (!int.TryParse(userIdClaim, out var userId))
            //   return Unauthorized("UserId inválido");


            var parametros = new Dictionary<string, object>
            {
                ["@UserId"] = userId
            };

            var data = await _db.ExecuteStoredProcedureAsync("dbo.sp_API_Catalogo_Obtener", parametros);

            return Ok(data);
        }
        [HttpPost("alta")]
        public async Task<IActionResult> Alta([FromBody] JsonElement data)
        {
            int userId = GetUserId();
            // if (!int.TryParse(userIdClaim, out var userId))
            //   return Unauthorized("UserId inválido");


            // ======================================
            // 1️⃣ SELECT PREVIO (validación)
            // ======================================
            int id_cons;

            string sqlValida = "select TOP 1 ID_CONS from w_permisos ORDER BY ID_CONS DESC";
            id_cons = (int)_db.ExecuteScalar(sqlValida,null);
            id_cons = id_cons + 1;
            string jsonData = data.GetRawText(); // Obtiene el JSON como texto
            JsonObject jsonObj = JsonNode.Parse(jsonData).AsObject();

            // Agregar campos nuevos
            jsonObj["id_cons"] = id_cons;
            jsonObj["id_personal"] = userId;
            jsonObj["estatus"] = 4;
            string jsonFinal = jsonObj.ToJsonString();

            // 5️⃣ Enviar SOLO el JSON al SP
            var parametros = new Dictionary<string, object>
            {
                { "@JsonData", jsonFinal }
            };
                var resultado = await _db.ExecuteStoredProcedure("sp_insertar", parametros);
                int idCons = Convert.ToInt32(resultado[0]["id_cons"]);

            var datosFormato = await _db.ExecuteStoredProcedure("SP_Permisos_ObtenerDatos",new Dictionary<string, object>{{ "@id_cons", idCons }}   );
            // 3️⃣ Generar PDF
            string pdfPath = _permisosPdfService.Generar(datosFormato, idCons);
            _permisosCorreoService.Enviar(datosFormato, pdfPath);
            // 4️⃣ Respuesta
            string archivox = "https://avimexintranet.com/formato_permiso/" + Path.GetFileName(pdfPath); 
            return Ok(new
            {
                ok = true,
                id_cons = idCons,
                archivo = archivox
            });
        }


        // 👉 ESTE ES EL LINK DEL CORREO

        [AllowAnonymous]
        [HttpGet("accion")]
        public async Task<IActionResult> Accion([FromQuery] Guid t)
        {
            var datos = await _db.ExecuteStoredProcedure(
                "SP_Permisos_ValidarToken",
                new Dictionary<string, object>
                {
            { "@token", t }
                });

            if (datos.Count == 0)
                return Content("<h2>Token inválido</h2>", "text/html");

            var r = datos[0];

            bool usado = r.ContainsKey("USADO") && r["USADO"] != null
                ? Convert.ToBoolean(r["USADO"])
                : false;

            if (usado)
                return Content("<h2>Este enlace ya fue utilizado</h2>", "text/html");

            DateTime fechaExpira =
                r.ContainsKey("FECHA_EXPIRA") && r["FECHA_EXPIRA"] != null
                ? Convert.ToDateTime(r["FECHA_EXPIRA"])
                : DateTime.MinValue;

            if (DateTime.Now > fechaExpira)
                return Content("<h2>Este enlace ha expirado</h2>", "text/html");

            string html = $@"
                <!DOCTYPE html>
                <html lang='es'>
                <head>
                <meta charset='utf-8'>
                <title>Aprobación de Permiso</title>
                <style>
                body {{ font-family: Arial; background:#f4f6f8; }}
                .card {{ max-width:600px;margin:40px auto;background:white;padding:25px;border-radius:6px }}
                .btn {{ padding:12px 18px;border:none;cursor:pointer }}
                .ok {{ background:#2ecc71;color:white }}
                .no {{ background:#e74c3c;color:white }}
                </style>
                </head>
                <body>

                <div class='card'>
                <h2>Solicitud de Permiso</h2>
                <p><b>Empleado:</b> {r["NOMBRE_EMPLEADO"]}</p>
                <p><b>Fechas:</b> {Convert.ToDateTime(r["FECHA_PERMISO"]):dd/MM/yyyy}
                   - {Convert.ToDateTime(r["FECHA_PERMISO_A"]):dd/MM/yyyy}</p>
                <p><b>Motivo:</b> {r["TEXTO_PERMISO"]}</p>

                <hr>

                <button class='btn ok' id='aprobar' onclick='accion(1)'>Aprobar</button>
                <button class='btn no'  id='rechazar' onclick='accion(2)'>Rechazar</button>

                <p id='msg'></p>
                </div>

                <script>
                function accion(tipo) {{
                    document.getElementById('aprobar').disabled = true;
                    document.getElementById('rechazar').disabled = true;

                    fetch('/permisos/accionc', {{
                        method:'POST',
                        headers:{{'Content-Type':'application/json'}},
                        body:JSON.stringify({{
                            token:'{t}',
                            accion:tipo
                        }})
                    }})
                    .then(r=>r.text())
                    .then(txt=>document.getElementById('msg').innerText = txt);
                }}
                </script>

                </body>
                </html>";

            return Content(html, "text/html");
        }

        // ----------------------------
        // POST: APRUEBA / RECHAZA
        // ----------------------------
        [AllowAnonymous]
        [HttpPost("accionc")]
        public IActionResult ProcesarAccion([FromBody] AccionPermisoDto dto)
        {
            try
            {
                DataTable dt = _db.ExecuteDataTable(
                "SP_Permisos_ProcesarAccion",
                new Dictionary<string, object>
                {
            { "@token", dto.Token },
          { "@accion", dto.Accion }
                     },
                CommandType.StoredProcedure  
        );

                if (dt.Rows.Count == 0)
                    return StatusCode(500, "El SP no devolvió resultado.");

                bool ok = Convert.ToBoolean(dt.Rows[0]["OK"]);
                string mensaje = dt.Rows[0]["MENSAJE"].ToString();

                if (!ok)
                    return BadRequest(mensaje);   // 400 con mensaje claro

                return Ok(mensaje);              // 
            }
    catch (Exception ex)
    {
        return StatusCode(500, ex.Message);
    }
}
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            int userId = GetUserId();
            var parametros = new Dictionary<string, object>
                {
                    { "@IdUser", userId }
                };
            var json = await _db.ExecuteStoredProcedureJson(    "Permisos_Grid_admin",    parametros);
            return Content(json, "application/json");
        }
        [HttpPost("filtro")]
        public async Task<IActionResult> Post([FromBody] JsonElement data)
        {
            int userId = GetUserId();
            // if (!int.TryParse(userIdClaim, out var userId))
            //   return Unauthorized("UserId inválido");


            // ======================================
            // 1️⃣ SELECT PREVIO (validación)
            // ======================================
            int id_cons;

            string jsonData = data.GetRawText(); // Obtiene el JSON como texto
            
          
            // 5️⃣ Enviar SOLO el JSON al SP
            var parametros = new Dictionary<string, object>
            {
                { "@JsonFiltros", jsonData },
                { "@IdUser", userId }
            };
            string json = await _db.ExecuteStoredProcedureJson(    "SP_API_Permisos_Consulta",parametros);

            return Content(json, "application/json");
        }


        [HttpPost("estatus")]
        public async Task<IActionResult> estatus([FromBody] JsonElement data)
        {
            int userId = GetUserId();
            // if (!int.TryParse(userIdClaim, out var userId))
            //   return Unauthorized("UserId inválido");


            // ======================================
            // 1️⃣ SELECT PREVIO (validación)
            // ======================================
            int id_cons;


            string jsonData = data.GetRawText(); // Obtiene el JSON como texto
            JsonObject jsonObj = JsonNode.Parse(jsonData).AsObject();

            // Agregar campos nuevos
            jsonObj["ID_USUARIO_AUTORIZA"] = userId;
            jsonObj["fecha_actualizacion"] = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            string jsonFinal = jsonObj.ToJsonString();

            // 5️⃣ Enviar SOLO el JSON al SP
            var parametros = new Dictionary<string, object>
            {
                { "@JsonData", jsonFinal }
            };

            var resultado = await _db.ExecuteStoredProcedure("sp_actualizar", parametros);
           
            return Ok(resultado);
        }
        [HttpPost("pdfs")]
        public IActionResult ObtenerPDFs([FromBody] JsonElement PdfRequest)
        {
            int idUser = GetUserId(); // desde JWT

            string basePath = @"C:\AVIMEX\FORMATO_PERMISO";
            string baseUrl = "https://avimexintranet.com/formato_permiso/";
            // ← debe existir virtual directory en IIS

            var archivos = new List<string>();

            //            foreach (JsonElement idElement in PdfRequest.GetProperty("ids").EnumerateArray())
            //            {
            //            string id = idElement.GetString();
            //            string pattern = $"P_{id}_*.pdf";
            //            string fileName = $"P_{id}_{idUser}.pdf";
            //            string fullPath = Path.Combine(basePath, fileName);
            //            if (System.IO.File.Exists(fullPath))
            //archivos.Add(fullPath);
            //}

            foreach (JsonElement idElement in PdfRequest.GetProperty("ids").EnumerateArray())
            {
                string id = idElement.GetString();

                // 🔍 P_iii_*.pdf  → ignora el user
                string pattern = $"P_{id}_*.pdf";

                var files = Directory.GetFiles(basePath, pattern);

                foreach (var file in files)
                {
                    archivos.Add(file);
                }
            }
            if (archivos.Count == 0)
                return NotFound("No se encontraron archivos.");

            // 🔹 SOLO UNO
            if (archivos.Count == 1)
            {
                string archivo = Path.GetFileName(archivos[0]);

                return Ok(new
                {
                    tipo = "pdf",
                    url = $"{baseUrl}/{archivo}"
                });
            }

            // 🔹 VARIOS → ZIP
            string zipName = $"PERMISOS_{idUser}_{DateTime.Now:yyyyMMddHHmmss}.zip";
            string zipPath = Path.Combine(basePath, zipName);

            using (var zip = ZipFile.Open(zipPath, ZipArchiveMode.Create))
            {
                foreach (var file in archivos)
                {
                    zip.CreateEntryFromFile(file, Path.GetFileName(file));
                }
            }

            return Ok(new
            {
                tipo = "zip",
                url = $"{baseUrl}/{zipName}"
            });
        }

    }
}



public class AccionPermisoDto
    {
        public Guid Token { get; set; }
        public int Accion { get; set; } // APROBADO / RECHAZADO
    }
