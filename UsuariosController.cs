using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using WebBACK.Data;

namespace WebBACK.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/usuarios")]
    [EnableCors("PermitirOrigenLocalhost3000")]
    public class UsuariosController : ControllerBase
    {
        private readonly DatabaseHelper _db;

        public UsuariosController(DatabaseHelper db)
        {
            _db = db;
        }

        [HttpGet("grupos")]
        public async Task<IActionResult> GetGrupos()
        {
            var rows = await _db.ExecuteQueryAsync_sql("EXEC dbo.API_Usuarios_Grupos");
            var json = rows.Count > 0 && rows[0].TryGetValue("JsonData", out var value)
                ? Convert.ToString(value) ?? "[]"
                : "[]";

            if (string.IsNullOrWhiteSpace(json) || json.Trim().ToLower() == "null")
                json = "[]";

            try
            {
                var raw = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(json)
                          ?? new List<Dictionary<string, object>>();

                var mapped = raw
                    .Select(item =>
                    {
                        string id = item.TryGetValue("id", out var idValue)
                            ? Convert.ToString(idValue) ?? ""
                            : "";
                        string label = item.TryGetValue("nombre_g", out var labelValue)
                            ? Convert.ToString(labelValue) ?? ""
                            : "";
                        if (string.IsNullOrWhiteSpace(label) && !string.IsNullOrWhiteSpace(id))
                            label = id;
                        return new { id, label, value = label };
                    })
                    .Where(item => !string.IsNullOrWhiteSpace(item.id) || !string.IsNullOrWhiteSpace(item.label))
                    .ToList();

                return Content($"{{\"data\": {JsonSerializer.Serialize(mapped)}}}", "application/json");
            }
            catch
            {
                return Content($"{{\"data\": {json}}}", "application/json");
            }
        }



        [HttpPost("listado")]
        public async Task<IActionResult> PostListado([FromBody] JsonElement data)
        {
            string jsonData = data.GetRawText();
            if (string.IsNullOrWhiteSpace(jsonData))
            {
                jsonData = "{}";
            }

            // Escapar comillas simples para SQL
            string safeJson = jsonData.Replace("'", "''");

            var rows = await _db.ExecuteQueryAsync_sql(
                $"EXEC dbo.API_Usuarios_Listado @JsonData = N'{safeJson}'"
            );

            var json = rows.Count > 0 && rows[0].TryGetValue("JsonData", out var value)
                ? Convert.ToString(value) ?? "[]"
                : "[]";

            if (string.IsNullOrWhiteSpace(json) || json.Trim().ToLower() == "null")
            {
                json = "[]";
            }

            return Content($"{{\"data\": {json}}}", "application/json");
        }




























    }
}
