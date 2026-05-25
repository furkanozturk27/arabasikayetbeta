/**
 * Static vehicle catalogue — mirrors supabase/schema.sql seed data.
 * Used as a fallback when Supabase is not yet configured so that
 * /araclar and the complaint wizard work immediately after clone.
 */

export interface StaticVehicle {
  id: string; // deterministic: brand-model-year-engine slugified
  brand: string;
  model: string;
  year: number;
  engine: string;
  trim: string | null;
  transmission: 'manual' | 'automatic' | 'cvt' | 'dct';
  fuel_type: 'gasoline' | 'diesel' | 'hybrid' | 'electric' | 'lpg';
}

function slug(...parts: (string | number)[]) {
  return parts.map(p => String(p).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')).join('--');
}

const RAW: Omit<StaticVehicle, 'id'>[] = [
  // ── Toyota ──────────────────────────────────────────────────────────────
  { brand:'Toyota', model:'Corolla', year:2020, engine:'1.6 Valvematic', trim:'Dream',           transmission:'automatic', fuel_type:'gasoline' },
  { brand:'Toyota', model:'Corolla', year:2021, engine:'1.8 Hybrid',     trim:'Design Hybrid',   transmission:'cvt',       fuel_type:'hybrid'   },
  { brand:'Toyota', model:'Corolla', year:2022, engine:'2.0 Hybrid',     trim:'GR Sport',        transmission:'cvt',       fuel_type:'hybrid'   },
  { brand:'Toyota', model:'Corolla', year:2019, engine:'1.6 Valvematic', trim:'Flame',           transmission:'manual',    fuel_type:'gasoline' },
  { brand:'Toyota', model:'Yaris',   year:2021, engine:'1.5 Hybrid',     trim:'Dream',           transmission:'cvt',       fuel_type:'hybrid'   },
  { brand:'Toyota', model:'Yaris',   year:2022, engine:'1.0 VVT-i',      trim:'Flame',           transmission:'manual',    fuel_type:'gasoline' },
  { brand:'Toyota', model:'RAV4',    year:2021, engine:'2.5 Hybrid',     trim:'Dream Hybrid AWD',transmission:'cvt',       fuel_type:'hybrid'   },
  { brand:'Toyota', model:'C-HR',    year:2020, engine:'1.8 Hybrid',     trim:'Design',          transmission:'cvt',       fuel_type:'hybrid'   },
  // ── Volkswagen ─────────────────────────────────────────────────────────
  { brand:'Volkswagen', model:'Golf',   year:2020, engine:'1.5 TSI', trim:'Comfortline', transmission:'automatic', fuel_type:'gasoline' },
  { brand:'Volkswagen', model:'Golf',   year:2021, engine:'2.0 TDI', trim:'Highline',    transmission:'automatic', fuel_type:'diesel'   },
  { brand:'Volkswagen', model:'Passat', year:2021, engine:'1.5 TSI', trim:'Elegance',    transmission:'automatic', fuel_type:'gasoline' },
  { brand:'Volkswagen', model:'Passat', year:2020, engine:'2.0 TDI', trim:'Business',    transmission:'automatic', fuel_type:'diesel'   },
  { brand:'Volkswagen', model:'Tiguan', year:2021, engine:'1.5 TSI', trim:'Comfortline', transmission:'automatic', fuel_type:'gasoline' },
  { brand:'Volkswagen', model:'Polo',   year:2022, engine:'1.0 TSI', trim:'Life',        transmission:'automatic', fuel_type:'gasoline' },
  { brand:'Volkswagen', model:'T-Roc',  year:2022, engine:'1.5 TSI', trim:'Style',       transmission:'automatic', fuel_type:'gasoline' },
  // ── Renault ────────────────────────────────────────────────────────────
  { brand:'Renault', model:'Clio',   year:2021, engine:'1.0 TCe', trim:'Joy',     transmission:'manual',    fuel_type:'gasoline' },
  { brand:'Renault', model:'Clio',   year:2022, engine:'1.3 TCe', trim:'RS Line', transmission:'automatic', fuel_type:'gasoline' },
  { brand:'Renault', model:'Megane', year:2021, engine:'1.5 dCi', trim:'Touch',   transmission:'manual',    fuel_type:'diesel'   },
  { brand:'Renault', model:'Megane', year:2020, engine:'1.3 TCe', trim:'Joy',     transmission:'automatic', fuel_type:'gasoline' },
  { brand:'Renault', model:'Captur', year:2022, engine:'1.0 TCe', trim:'Joy',     transmission:'manual',    fuel_type:'gasoline' },
  { brand:'Renault', model:'Kadjar', year:2020, engine:'1.5 dCi', trim:'Touch',   transmission:'manual',    fuel_type:'diesel'   },
  // ── Hyundai ────────────────────────────────────────────────────────────
  { brand:'Hyundai', model:'i20',    year:2021, engine:'1.0 T-GDI',          trim:'Elite',         transmission:'automatic', fuel_type:'gasoline' },
  { brand:'Hyundai', model:'Elantra',year:2022, engine:'1.6 MPI',            trim:'Style',         transmission:'automatic', fuel_type:'gasoline' },
  { brand:'Hyundai', model:'Tucson', year:2022, engine:'1.6 T-GDI Hybrid',   trim:'Elite Hybrid',  transmission:'automatic', fuel_type:'hybrid'   },
  { brand:'Hyundai', model:'Tucson', year:2021, engine:'2.0 MPI',            trim:'Style',         transmission:'automatic', fuel_type:'gasoline' },
  { brand:'Hyundai', model:'i10',    year:2022, engine:'1.0 MPI',            trim:'Jump',          transmission:'manual',    fuel_type:'gasoline' },
  // ── Kia ───────────────────────────────────────────────────────────────
  { brand:'Kia', model:'Sportage', year:2022, engine:'1.6 T-GDI Hybrid', trim:'Prestige Hybrid', transmission:'automatic', fuel_type:'hybrid'   },
  { brand:'Kia', model:'Ceed',     year:2021, engine:'1.5 T-GDI',        trim:'Comfort',         transmission:'automatic', fuel_type:'gasoline' },
  { brand:'Kia', model:'Stonic',   year:2022, engine:'1.0 T-GDI',        trim:'Style',           transmission:'automatic', fuel_type:'gasoline' },
  // ── Ford ──────────────────────────────────────────────────────────────
  { brand:'Ford', model:'Focus',  year:2021, engine:'1.5 EcoBlue',          trim:'Titanium',            transmission:'automatic', fuel_type:'diesel'   },
  { brand:'Ford', model:'Focus',  year:2020, engine:'1.5 EcoBoost',         trim:'Trend X',             transmission:'manual',    fuel_type:'gasoline' },
  { brand:'Ford', model:'Puma',   year:2022, engine:'1.0 EcoBoost Hybrid',  trim:'Titanium',            transmission:'manual',    fuel_type:'hybrid'   },
  { brand:'Ford', model:'Fiesta', year:2021, engine:'1.1 Ti-VCT',           trim:'Trend',               transmission:'manual',    fuel_type:'gasoline' },
  { brand:'Ford', model:'Kuga',   year:2021, engine:'2.5 Plug-In Hybrid',   trim:'Titanium',            transmission:'automatic', fuel_type:'hybrid'   },
  // ── BMW ───────────────────────────────────────────────────────────────
  { brand:'BMW', model:'3 Serisi', year:2021, engine:'320i',    trim:'M Sport',    transmission:'automatic', fuel_type:'gasoline' },
  { brand:'BMW', model:'3 Serisi', year:2020, engine:'320d',    trim:'Sport Line', transmission:'automatic', fuel_type:'diesel'   },
  { brand:'BMW', model:'1 Serisi', year:2022, engine:'118i',    trim:'M Sport',    transmission:'automatic', fuel_type:'gasoline' },
  { brand:'BMW', model:'X3',       year:2021, engine:'xDrive20d',trim:'xLine',     transmission:'automatic', fuel_type:'diesel'   },
  { brand:'BMW', model:'X1',       year:2022, engine:'sDrive18i',trim:'Sport Line',transmission:'automatic', fuel_type:'gasoline' },
  // ── Mercedes ──────────────────────────────────────────────────────────
  { brand:'Mercedes', model:'C Serisi', year:2022, engine:'C 200',     trim:'AMG Line',   transmission:'automatic', fuel_type:'gasoline' },
  { brand:'Mercedes', model:'C Serisi', year:2021, engine:'C 220 d',   trim:'Avantgarde', transmission:'automatic', fuel_type:'diesel'   },
  { brand:'Mercedes', model:'A Serisi', year:2022, engine:'A 180',     trim:'Progressive',transmission:'automatic', fuel_type:'gasoline' },
  { brand:'Mercedes', model:'GLC',      year:2021, engine:'300 4Matic', trim:'AMG Line',  transmission:'automatic', fuel_type:'gasoline' },
  // ── Audi ──────────────────────────────────────────────────────────────
  { brand:'Audi', model:'A3', year:2022, engine:'30 TFSI', trim:'Sport',    transmission:'automatic', fuel_type:'gasoline' },
  { brand:'Audi', model:'A4', year:2021, engine:'35 TDI',  trim:'Advanced', transmission:'automatic', fuel_type:'diesel'   },
  { brand:'Audi', model:'Q3', year:2022, engine:'35 TFSI', trim:'Advanced', transmission:'automatic', fuel_type:'gasoline' },
  // ── Honda ─────────────────────────────────────────────────────────────
  { brand:'Honda', model:'Civic', year:2022, engine:'1.5 VTEC Turbo', trim:'RS',       transmission:'manual',    fuel_type:'gasoline' },
  { brand:'Honda', model:'HR-V',  year:2022, engine:'1.5 i-MMD Hybrid',trim:'Advance', transmission:'automatic', fuel_type:'hybrid'   },
  // ── Fiat ──────────────────────────────────────────────────────────────
  { brand:'Fiat', model:'Egea', year:2022, engine:'1.4 Fire',    trim:'Urban',  transmission:'manual', fuel_type:'gasoline' },
  { brand:'Fiat', model:'Egea', year:2021, engine:'1.6 Multijet',trim:'Lounge', transmission:'manual', fuel_type:'diesel'   },
];

export const STATIC_VEHICLES: StaticVehicle[] = RAW.map(v => ({
  ...v,
  id: slug(v.brand, v.model, v.year, v.engine),
}));

/** Filter helper matching the /api/vehicles query params */
export function filterVehicles(params: {
  brand?: string;
  model?: string;
  year?: string | number;
  engine?: string;
}): StaticVehicle[] {
  return STATIC_VEHICLES.filter(v => {
    if (params.brand  && v.brand  !== params.brand)  return false;
    if (params.model  && v.model  !== params.model)  return false;
    if (params.year   && v.year   !== Number(params.year))  return false;
    if (params.engine && v.engine !== params.engine) return false;
    return true;
  });
}
