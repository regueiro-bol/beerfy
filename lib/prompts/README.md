# Prompts versionados

Cada prompt de IA del proyecto vive aquí con sufijo de versión.

Convención:
- Archivo: {nombre-feature}.v{N}.ts
- Export: NAME_V1 = { version, reviewedBy, reviewedAt, prompt, jsonSchema? }
- Cualquier cambio significativo incrementa la versión (v1.ts → v2.ts, no se edita la anterior).
- Commit con prefijo "ai:" describiendo el cambio.

Lista esperada (a poblar desde Sprint 2):
- description-generator.v1.ts (Sprint 2)
- suggestion-moderator.v1.ts (Sprint 3)
- review-synthesizer.v1.ts (Sprint 4)
- pour-quality.v1.ts (Sprint 4)
- venue-clusterer.v1.ts (Sprint 6)
- personalizer.v1.ts (Sprint 6)
