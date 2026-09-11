# masterclass.notify-me

Service app IO da demo Masterclass. Persiste pedidos de avise-me (`email`, `skuId`) no Master Data e lista os pendentes.

## Schema Master Data (GET)

O builder **não** usa o `title` do `schema.json` como nome do schema. Em link, o nome publicado é `{versão}-{workspace}` (ex.: `0.1.1-mceduardoluciano`). O GET deve usar esse nome em `searchDocuments`, não `v1`.


| Item | Valor |
| --- | --- |
| App | `masterclass.notify-me@0.1.1` |
| Conta | `masterclass` |
| Workspace | `mceduardoluciano` |
| URL | https://mceduardoluciano--masterclass.myvtex.com/_v/notify-me |

`skills-lock.json` neste repositório contém somente skills **VTEX IO** e **Master Data**.

## Curls de prova

Com o app linkado no workspace (`vtex link`):

```bash
curl -X POST "https://mceduardoluciano--masterclass.myvtex.com/_v/notify-me" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"demo@example.com\",\"skuId\":\"1\"}"

curl "https://mceduardoluciano--masterclass.myvtex.com/_v/notify-me?skuId=1"
```

Página seguinte (20 itens por página):

```bash
curl "https://mceduardoluciano--masterclass.myvtex.com/_v/notify-me?skuId=1&page=2"
```
