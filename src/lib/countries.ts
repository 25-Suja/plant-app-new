// ISO 3166-1 alpha-2 codes with the English names (and common aliases) iNaturalist uses for countries.
// Used only to match iNaturalist place names to Mapbox's country boundaries; no plant data lives here.

const RAW: string[][] = [
  ['AF', 'Afghanistan'], ['AL', 'Albania'], ['DZ', 'Algeria'], ['AS', 'American Samoa'], ['AD', 'Andorra'],
  ['AO', 'Angola'], ['AI', 'Anguilla'], ['AQ', 'Antarctica'], ['AG', 'Antigua and Barbuda'], ['AR', 'Argentina'],
  ['AM', 'Armenia'], ['AW', 'Aruba'], ['AU', 'Australia'], ['AT', 'Austria'], ['AZ', 'Azerbaijan'],
  ['BS', 'Bahamas', 'The Bahamas'], ['BH', 'Bahrain'], ['BD', 'Bangladesh'], ['BB', 'Barbados'], ['BY', 'Belarus'],
  ['BE', 'Belgium'], ['BZ', 'Belize'], ['BJ', 'Benin'], ['BM', 'Bermuda'], ['BT', 'Bhutan'],
  ['BO', 'Bolivia', 'Plurinational State of Bolivia'], ['BQ', 'Bonaire, Sint Eustatius and Saba', 'Caribbean Netherlands'],
  ['BA', 'Bosnia and Herzegovina'], ['BW', 'Botswana'], ['BV', 'Bouvet Island'], ['BR', 'Brazil'],
  ['IO', 'British Indian Ocean Territory'], ['VG', 'British Virgin Islands', 'Virgin Islands, British'],
  ['BN', 'Brunei', 'Brunei Darussalam'], ['BG', 'Bulgaria'], ['BF', 'Burkina Faso'], ['BI', 'Burundi'],
  ['CV', 'Cape Verde', 'Cabo Verde'], ['KH', 'Cambodia'], ['CM', 'Cameroon'], ['CA', 'Canada'],
  ['KY', 'Cayman Islands'], ['CF', 'Central African Republic'], ['TD', 'Chad'], ['CL', 'Chile'], ['CN', 'China'],
  ['CX', 'Christmas Island'], ['CC', 'Cocos (Keeling) Islands', 'Cocos Islands'], ['CO', 'Colombia'], ['KM', 'Comoros'],
  ['CG', 'Republic of the Congo', 'Congo', 'Congo-Brazzaville'],
  ['CD', 'Democratic Republic of the Congo', 'Congo (Kinshasa)', 'DR Congo', 'Congo-Kinshasa'],
  ['CK', 'Cook Islands'], ['CR', 'Costa Rica'], ['CI', "Cote d'Ivoire", 'Ivory Coast'], ['HR', 'Croatia'], ['CU', 'Cuba'],
  ['CW', 'Curacao'], ['CY', 'Cyprus'], ['CZ', 'Czechia', 'Czech Republic'], ['DK', 'Denmark'], ['DJ', 'Djibouti'],
  ['DM', 'Dominica'], ['DO', 'Dominican Republic'], ['EC', 'Ecuador'], ['EG', 'Egypt'], ['SV', 'El Salvador'],
  ['GQ', 'Equatorial Guinea'], ['ER', 'Eritrea'], ['EE', 'Estonia'], ['SZ', 'Eswatini', 'Swaziland'], ['ET', 'Ethiopia'],
  ['FK', 'Falkland Islands', 'Falkland Islands (Malvinas)'], ['FO', 'Faroe Islands'], ['FJ', 'Fiji'], ['FI', 'Finland'],
  ['FR', 'France'], ['GF', 'French Guiana'], ['PF', 'French Polynesia'], ['TF', 'French Southern Territories'],
  ['GA', 'Gabon'], ['GM', 'Gambia', 'The Gambia'], ['GE', 'Georgia'], ['DE', 'Germany'], ['GH', 'Ghana'],
  ['GI', 'Gibraltar'], ['GR', 'Greece'], ['GL', 'Greenland'], ['GD', 'Grenada'], ['GP', 'Guadeloupe'], ['GU', 'Guam'],
  ['GT', 'Guatemala'], ['GG', 'Guernsey'], ['GN', 'Guinea'], ['GW', 'Guinea-Bissau', 'Guinea Bissau'], ['GY', 'Guyana'],
  ['HT', 'Haiti'], ['HM', 'Heard Island and McDonald Islands'], ['VA', 'Vatican City', 'Holy See', 'Vatican'],
  ['HN', 'Honduras'], ['HK', 'Hong Kong'], ['HU', 'Hungary'], ['IS', 'Iceland'], ['IN', 'India'], ['ID', 'Indonesia'],
  ['IR', 'Iran', 'Islamic Republic of Iran'], ['IQ', 'Iraq'], ['IE', 'Ireland'], ['IM', 'Isle of Man'], ['IL', 'Israel'],
  ['IT', 'Italy'], ['JM', 'Jamaica'], ['JP', 'Japan'], ['JE', 'Jersey'], ['JO', 'Jordan'], ['KZ', 'Kazakhstan'],
  ['KE', 'Kenya'], ['KI', 'Kiribati'], ['XK', 'Kosovo'], ['KW', 'Kuwait'], ['KG', 'Kyrgyzstan'],
  ['LA', 'Laos', "Lao People's Democratic Republic"], ['LV', 'Latvia'], ['LB', 'Lebanon'], ['LS', 'Lesotho'],
  ['LR', 'Liberia'], ['LY', 'Libya'], ['LI', 'Liechtenstein'], ['LT', 'Lithuania'], ['LU', 'Luxembourg'],
  ['MO', 'Macao', 'Macau'], ['MG', 'Madagascar'], ['MW', 'Malawi'], ['MY', 'Malaysia'], ['MV', 'Maldives'],
  ['ML', 'Mali'], ['MT', 'Malta'], ['MH', 'Marshall Islands'], ['MQ', 'Martinique'], ['MR', 'Mauritania'],
  ['MU', 'Mauritius'], ['YT', 'Mayotte'], ['MX', 'Mexico'], ['FM', 'Micronesia', 'Federated States of Micronesia'],
  ['MD', 'Moldova', 'Republic of Moldova'], ['MC', 'Monaco'], ['MN', 'Mongolia'], ['ME', 'Montenegro'],
  ['MS', 'Montserrat'], ['MA', 'Morocco'], ['MZ', 'Mozambique'], ['MM', 'Myanmar', 'Burma'], ['NA', 'Namibia'],
  ['NR', 'Nauru'], ['NP', 'Nepal'], ['NL', 'Netherlands', 'The Netherlands'], ['NC', 'New Caledonia'],
  ['NZ', 'New Zealand'], ['NI', 'Nicaragua'], ['NE', 'Niger'], ['NG', 'Nigeria'], ['NU', 'Niue'],
  ['NF', 'Norfolk Island'], ['KP', 'North Korea', "Democratic People's Republic of Korea"],
  ['MK', 'North Macedonia', 'Macedonia'], ['MP', 'Northern Mariana Islands'], ['NO', 'Norway'], ['OM', 'Oman'],
  ['PK', 'Pakistan'], ['PW', 'Palau'], ['PS', 'Palestine', 'State of Palestine', 'Palestinian Territories'],
  ['PA', 'Panama'], ['PG', 'Papua New Guinea'], ['PY', 'Paraguay'], ['PE', 'Peru'], ['PH', 'Philippines'],
  ['PN', 'Pitcairn Islands', 'Pitcairn'], ['PL', 'Poland'], ['PT', 'Portugal'], ['PR', 'Puerto Rico'], ['QA', 'Qatar'],
  ['RE', 'Reunion'], ['RO', 'Romania'], ['RU', 'Russia', 'Russian Federation'], ['RW', 'Rwanda'],
  ['BL', 'Saint Barthelemy', 'Saint-Barthelemy'], ['SH', 'Saint Helena', 'Saint Helena, Ascension and Tristan da Cunha'],
  ['KN', 'Saint Kitts and Nevis'], ['LC', 'Saint Lucia'], ['MF', 'Saint Martin'], ['PM', 'Saint Pierre and Miquelon'],
  ['VC', 'Saint Vincent and the Grenadines'], ['WS', 'Samoa'], ['SM', 'San Marino'], ['ST', 'Sao Tome and Principe'],
  ['SA', 'Saudi Arabia'], ['SN', 'Senegal'], ['RS', 'Serbia'], ['SC', 'Seychelles'], ['SL', 'Sierra Leone'],
  ['SG', 'Singapore'], ['SX', 'Sint Maarten'], ['SK', 'Slovakia'], ['SI', 'Slovenia'], ['SB', 'Solomon Islands'],
  ['SO', 'Somalia'], ['ZA', 'South Africa'], ['GS', 'South Georgia and the South Sandwich Islands'],
  ['KR', 'South Korea', 'Republic of Korea', 'Korea'], ['SS', 'South Sudan'], ['ES', 'Spain'], ['LK', 'Sri Lanka'],
  ['SD', 'Sudan'], ['SR', 'Suriname'], ['SJ', 'Svalbard and Jan Mayen', 'Svalbard'], ['SE', 'Sweden'],
  ['CH', 'Switzerland'], ['SY', 'Syria', 'Syrian Arab Republic'], ['TW', 'Taiwan'], ['TJ', 'Tajikistan'],
  ['TZ', 'Tanzania', 'United Republic of Tanzania'], ['TH', 'Thailand'], ['TL', 'Timor-Leste', 'East Timor'],
  ['TG', 'Togo'], ['TK', 'Tokelau'], ['TO', 'Tonga'], ['TT', 'Trinidad and Tobago'], ['TN', 'Tunisia'],
  ['TR', 'Turkey', 'Turkiye'], ['TM', 'Turkmenistan'], ['TC', 'Turks and Caicos Islands'], ['TV', 'Tuvalu'],
  ['UG', 'Uganda'], ['UA', 'Ukraine'], ['AE', 'United Arab Emirates'], ['GB', 'United Kingdom', 'UK', 'Great Britain'],
  ['US', 'United States', 'United States of America', 'USA'], ['UM', 'United States Minor Outlying Islands'],
  ['UY', 'Uruguay'], ['UZ', 'Uzbekistan'], ['VU', 'Vanuatu'], ['VE', 'Venezuela', 'Bolivarian Republic of Venezuela'],
  ['VN', 'Vietnam', 'Viet Nam'], ['VI', 'U.S. Virgin Islands', 'United States Virgin Islands', 'Virgin Islands, U.S.'],
  ['WF', 'Wallis and Futuna'], ['EH', 'Western Sahara'], ['YE', 'Yemen'], ['ZM', 'Zambia'], ['ZW', 'Zimbabwe'],
  ['AX', 'Aland Islands'],
]

export const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/^the /, '')
    .trim()

const BY_NAME = new Map<string, string>()
for (const [iso, ...names] of RAW) for (const n of names) BY_NAME.set(norm(n), iso)

/** ISO 3166-1 alpha-2 code for an English country name, or null if we do not recognise it. */
export function countryCode(name: string): string | null {
  return BY_NAME.get(norm(name)) ?? null
}
