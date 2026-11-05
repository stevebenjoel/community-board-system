// Format an exact decimal without converting financial values to floating point.
export function formatMoney(amount:string,currency:string,locale='en-NG'):string {
  if(!/^\d+\.\d{2}$/.test(amount))throw new Error('Expected an exact two-decimal amount.');
  const [major,cents]=amount.split('.');
  return new Intl.NumberFormat(locale,{style:'currency',currency,minimumFractionDigits:2,maximumFractionDigits:2}).formatToParts(BigInt(major)).map(part=>part.type==='fraction'?cents:part.value).join('');
}
