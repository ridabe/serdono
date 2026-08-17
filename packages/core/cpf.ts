/**
 * CPF — máscara e validação de dígito verificador, sem consulta a API
 * externa. Mesmo espírito "sem falsa certeza jurídica" de `cnpj.ts`:
 * confirmamos que o número é matematicamente válido, nunca que a pessoa
 * existe de verdade.
 */

export function unmaskCpf(value: string): string {
  return value.replace(/\D/g, "");
}

/** Aplica a máscara 000.000.000-00 progressivamente, para uso em onChangeText. */
export function maskCpf(value: string): string {
  const digits = unmaskCpf(value).slice(0, 11);
  let out = digits;
  if (digits.length > 3) out = `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length > 6) out = `${out.slice(0, 7)}.${out.slice(7)}`;
  if (digits.length > 9) out = `${out.slice(0, 11)}-${out.slice(11)}`;
  return out;
}

function digitoVerificador(digits: string): number {
  const pesoInicial = digits.length + 1;
  const soma = digits.split("").reduce((acc, d, i) => acc + Number(d) * (pesoInicial - i), 0);
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

/** Valida os dois dígitos verificadores (algoritmo público do CPF) — rejeita sequências repetidas (00000000000 etc). */
export function isValidCpf(value: string): boolean {
  const digits = unmaskCpf(value);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const dv1 = digitoVerificador(digits.slice(0, 9));
  if (dv1 !== Number(digits[9])) return false;

  const dv2 = digitoVerificador(digits.slice(0, 10));
  return dv2 === Number(digits[10]);
}
