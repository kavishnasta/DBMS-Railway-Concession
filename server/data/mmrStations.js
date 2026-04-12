/*
 * Mumbai Metropolitan Region (MMR) Suburban Railway & Metro Stations
 * ====================================================================
 *
 * Source: Compiled from Western Railway, Central Railway, and Mumbai
 * Metro Rail Corporation public timetables. There is no free public
 * API for the MMR suburban network — Indian Railways does not publish
 * one. data.gov.in offers an all-India station CSV but it is not an
 * API and includes ~8000 entries that need filtering by hand.
 *
 * The suburban station list changes only when a new station opens
 * (rare), so a checked-in static file is the right primitive here.
 *
 * Updates as of: 2026
 */

const RAILWAY_LINES = {
  western: {
    label: 'Western Line',
    code: 'WR',
    description: 'Churchgate \u2192 Dahanu Road',
    stations: [
      { name: 'Churchgate', code: 'CCG' },
      { name: 'Marine Lines', code: 'MEL' },
      { name: 'Charni Road', code: 'CYR' },
      { name: 'Grant Road', code: 'GTR' },
      { name: 'Mumbai Central', code: 'BCT' },
      { name: 'Mahalaxmi', code: 'MX' },
      { name: 'Lower Parel', code: 'PEL' },
      { name: 'Prabhadevi', code: 'PBHV' },
      { name: 'Dadar', code: 'DDR' },
      { name: 'Matunga Road', code: 'MRU' },
      { name: 'Mahim Junction', code: 'MM' },
      { name: 'Bandra', code: 'BA' },
      { name: 'Khar Road', code: 'KHAR' },
      { name: 'Santacruz', code: 'STC' },
      { name: 'Vile Parle', code: 'VLP' },
      { name: 'Andheri', code: 'ADH' },
      { name: 'Jogeshwari', code: 'JOS' },
      { name: 'Ram Mandir', code: 'RMAR' },
      { name: 'Goregaon', code: 'GMN' },
      { name: 'Malad', code: 'MDD' },
      { name: 'Kandivali', code: 'KILE' },
      { name: 'Borivali', code: 'BVI' },
      { name: 'Dahisar', code: 'DAR' },
      { name: 'Mira Road', code: 'MIRA' },
      { name: 'Bhayandar', code: 'BYR' },
      { name: 'Naigaon', code: 'NIG' },
      { name: 'Vasai Road', code: 'BSR' },
      { name: 'Nallasopara', code: 'NSP' },
      { name: 'Virar', code: 'VR' },
      { name: 'Vaitarna', code: 'VTN' },
      { name: 'Saphale', code: 'SAH' },
      { name: 'Kelve Road', code: 'KLV' },
      { name: 'Palghar', code: 'PLG' },
      { name: 'Umroli', code: 'UMR' },
      { name: 'Boisar', code: 'BOR' },
      { name: 'Vangaon', code: 'VGN' },
      { name: 'Dahanu Road', code: 'DRD' },
    ],
  },
  central: {
    label: 'Central Line',
    code: 'CR',
    description: 'CSMT \u2192 Kalyan / Kasara / Khopoli',
    stations: [
      { name: 'Chhatrapati Shivaji Maharaj Terminus', code: 'CSMT' },
      { name: 'Masjid', code: 'MSD' },
      { name: 'Sandhurst Road', code: 'SNRD' },
      { name: 'Byculla', code: 'BY' },
      { name: 'Chinchpokli', code: 'CHG' },
      { name: 'Currey Road', code: 'CRD' },
      { name: 'Parel', code: 'PR' },
      { name: 'Dadar', code: 'DR' },
      { name: 'Matunga', code: 'MTN' },
      { name: 'Sion', code: 'SIN' },
      { name: 'Kurla', code: 'CLA' },
      { name: 'Vidyavihar', code: 'VVH' },
      { name: 'Ghatkopar', code: 'GC' },
      { name: 'Vikhroli', code: 'VK' },
      { name: 'Kanjurmarg', code: 'KJMG' },
      { name: 'Bhandup', code: 'BND' },
      { name: 'Nahur', code: 'NHU' },
      { name: 'Mulund', code: 'MLND' },
      { name: 'Thane', code: 'TNA' },
      { name: 'Kalwa', code: 'KLVA' },
      { name: 'Mumbra', code: 'MBQ' },
      { name: 'Diva Junction', code: 'DIVA' },
      { name: 'Kopar', code: 'KOPR' },
      { name: 'Dombivli', code: 'DI' },
      { name: 'Thakurli', code: 'THK' },
      { name: 'Kalyan Junction', code: 'KYN' },
      // Kasara branch
      { name: 'Shahad', code: 'SHAD' },
      { name: 'Ambivli', code: 'ABY' },
      { name: 'Titwala', code: 'TLA' },
      { name: 'Khadavli', code: 'KDV' },
      { name: 'Vasind', code: 'VSD' },
      { name: 'Asangaon', code: 'ASO' },
      { name: 'Atgaon', code: 'AT' },
      { name: 'Thansit', code: 'THS' },
      { name: 'Khardi', code: 'KAD' },
      { name: 'Umbermali', code: 'UBR' },
      { name: 'Kasara', code: 'KSRA' },
      // Khopoli branch
      { name: 'Vithalwadi', code: 'VLDI' },
      { name: 'Ulhasnagar', code: 'ULNR' },
      { name: 'Ambernath', code: 'ABL' },
      { name: 'Badlapur', code: 'BL' },
      { name: 'Vangani', code: 'VGNI' },
      { name: 'Shelu', code: 'SHLU' },
      { name: 'Neral', code: 'NRL' },
      { name: 'Bhivpuri Road', code: 'BVP' },
      { name: 'Karjat', code: 'KJT' },
      { name: 'Palasdari', code: 'PSDR' },
      { name: 'Kelavli', code: 'KEL' },
      { name: 'Dolavli', code: 'DLA' },
      { name: 'Lowjee', code: 'LWJ' },
      { name: 'Khopoli', code: 'KP' },
    ],
  },
  harbour: {
    label: 'Harbour Line',
    code: 'HR',
    description: 'CSMT \u2192 Panvel / Goregaon',
    stations: [
      { name: 'Chhatrapati Shivaji Maharaj Terminus', code: 'CSMT' },
      { name: 'Masjid', code: 'MSD' },
      { name: 'Sandhurst Road', code: 'SNRD' },
      { name: 'Dockyard Road', code: 'DKRD' },
      { name: 'Reay Road', code: 'RRD' },
      { name: 'Cotton Green', code: 'CTGN' },
      { name: 'Sewri', code: 'SVE' },
      { name: 'Vadala Road', code: 'VDLR' },
      // CSMT-Panvel branch
      { name: 'GTB Nagar', code: 'GTBN' },
      { name: 'Chunabhatti', code: 'CHBT' },
      { name: 'Kurla', code: 'CLA' },
      { name: 'Tilak Nagar', code: 'TLNR' },
      { name: 'Chembur', code: 'CMBR' },
      { name: 'Govandi', code: 'GV' },
      { name: 'Mankhurd', code: 'MNKD' },
      { name: 'Vashi', code: 'VSH' },
      { name: 'Sanpada', code: 'SNPD' },
      { name: 'Juinagar', code: 'JNRD' },
      { name: 'Nerul', code: 'NEU' },
      { name: 'Seawoods-Darave', code: 'SWDV' },
      { name: 'Belapur CBD', code: 'BPCB' },
      { name: 'Kharghar', code: 'KHAG' },
      { name: 'Mansarovar', code: 'MNSR' },
      { name: 'Khandeshwar', code: 'KHAN' },
      { name: 'Panvel', code: 'PNVL' },
      // Vadala-Goregaon (Harbour extension)
      { name: 'King\u2019s Circle', code: 'KCRC' },
      { name: 'Mahim Junction', code: 'MM' },
      { name: 'Bandra', code: 'BA' },
      { name: 'Khar Road', code: 'KHAR' },
      { name: 'Santacruz', code: 'STC' },
      { name: 'Vile Parle', code: 'VLP' },
      { name: 'Andheri', code: 'ADH' },
      { name: 'Jogeshwari', code: 'JOS' },
      { name: 'Ram Mandir', code: 'RMAR' },
      { name: 'Goregaon', code: 'GMN' },
    ],
  },
};

const METRO_LINES = {
  line1: {
    label: 'Metro Line 1',
    code: 'M1',
    description: 'Versova \u2192 Ghatkopar (Blue Line)',
    stations: [
      { name: 'Versova' },
      { name: 'D.N. Nagar' },
      { name: 'Azad Nagar' },
      { name: 'Andheri' },
      { name: 'Western Express Highway' },
      { name: 'Chakala' },
      { name: 'Airport Road' },
      { name: 'Marol Naka' },
      { name: 'Saki Naka' },
      { name: 'Asalpha' },
      { name: 'Jagruti Nagar' },
      { name: 'Ghatkopar' },
    ],
  },
  line2a: {
    label: 'Metro Line 2A',
    code: 'M2A',
    description: 'Dahisar East \u2192 D.N. Nagar (Yellow Line)',
    stations: [
      { name: 'Dahisar East' },
      { name: 'Anand Nagar' },
      { name: 'Kandarpada' },
      { name: 'Mandapeshwar' },
      { name: 'Eksar' },
      { name: 'Borivali West' },
      { name: 'Pahadi Eksar' },
      { name: 'Kandivali West' },
      { name: 'Dahanukarwadi' },
      { name: 'Valnai' },
      { name: 'Malad West' },
      { name: 'Lower Malad' },
      { name: 'Bangur Nagar' },
      { name: 'Goregaon West' },
      { name: 'Pahadi Goregaon' },
      { name: 'Oshiwara' },
      { name: 'Lower Oshiwara' },
      { name: 'D.N. Nagar' },
    ],
  },
  line7: {
    label: 'Metro Line 7',
    code: 'M7',
    description: 'Dahisar East \u2192 Andheri East (Red Line)',
    stations: [
      { name: 'Dahisar East' },
      { name: 'Ovaripada' },
      { name: 'Rashtriya Udyan' },
      { name: 'Devipada' },
      { name: 'Magathane' },
      { name: 'Poisar' },
      { name: 'Akurli' },
      { name: 'Kurar' },
      { name: 'Dindoshi' },
      { name: 'Aarey' },
      { name: 'Goregaon East' },
      { name: 'Jogeshwari East' },
      { name: 'Mogra' },
      { name: 'Western Express Highway' },
      { name: 'Gundavali' },
    ],
  },
};

function uniqueSorted(stations) {
  const seen = new Set();
  const out = [];
  for (const s of stations) {
    if (!seen.has(s.name)) {
      seen.add(s.name);
      out.push(s);
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function flatten(linesObj) {
  const all = [];
  for (const key of Object.keys(linesObj)) {
    for (const s of linesObj[key].stations) all.push(s);
  }
  return uniqueSorted(all);
}

const RAILWAY_FLAT = flatten(RAILWAY_LINES);
const METRO_FLAT = flatten(METRO_LINES);

module.exports = {
  RAILWAY_LINES,
  METRO_LINES,
  RAILWAY_FLAT,
  METRO_FLAT,
};
