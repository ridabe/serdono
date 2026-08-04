/**
 * CNPJ — máscara e validação de dígito verificador, sem consulta a API
 * externa (Receita/BrasilAPI). Mesmo espírito "sem falsa certeza jurídica"
 * já aplicado à fase Formalização (PRD §9.4): confirmamos que o número é
 * matematicamente válido, nunca que o CNPJ existe ou está ativo de verdade.
 */

export function unmaskCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

/** Aplica a máscara 00.000.000/0000-00 progressivamente, para uso em onChangeText. */
export function maskCnpj(value: string): string {
  const digits = unmaskCnpj(value).slice(0, 14);
  let out = digits;
  if (digits.length > 2) out = `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length > 5) out = `${out.slice(0, 6)}.${out.slice(6)}`;
  if (digits.length > 8) out = `${out.slice(0, 10)}/${out.slice(10)}`;
  if (digits.length > 12) out = `${out.slice(0, 15)}-${out.slice(15)}`;
  return out;
}

function digitoVerificador(digits: string, pesos: number[]): number {
  const soma = digits.split("").reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/** Valida os dois dígitos verificadores (algoritmo público do CNPJ) — rejeita sequências repetidas (00000000000000 etc). */
export function isValidCnpj(value: string): boolean {
  const digits = unmaskCnpj(value);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const dv1 = digitoVerificador(digits.slice(0, 12), pesos1);
  if (dv1 !== Number(digits[12])) return false;

  const dv2 = digitoVerificador(digits.slice(0, 13), pesos2);
  return dv2 === Number(digits[13]);
}
