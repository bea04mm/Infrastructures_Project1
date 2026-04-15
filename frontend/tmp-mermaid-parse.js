const mermaid = require('mermaid');
const d1 = `flowchart TD
A[Admin cria evento] --> B[POST /usergroups]
B --> C[Criar User Group no ExtremeCloudIQ]
C --> D[GET /ssids/:ssid_id]
D --> E[Ler configuracao atual do SSID]
E --> F[Adicionar novo user_group_id a lista]
F --> G[PUT /ssids/:ssid_id/mode/ppsk]
G --> H[Atualizar SSID com lista completa]
H --> I[Evento ativo - convidados podem aceder]`;
try { mermaid.mermaidAPI.parse(d1); console.log('ok'); } catch (e) { console.error(e.str || e.message || e); }
