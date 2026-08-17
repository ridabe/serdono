// Existe só pro `tsc` resolver `import ".../SeletorTipoContrato"` sem
// extensão — mesma armadilha documentada em `DateTimeField.tsx`. Em
// runtime, o Metro NUNCA escolhe este arquivo.
export * from "./SeletorTipoContrato.native";
