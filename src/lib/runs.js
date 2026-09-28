// Editorial per-run metadata (zone name + route note), keyed by recording id.
// Kept in code (not the data JSON) so it can be reworded without rebuilding data.

export const ZONES = {
  '20260506_152621': 'University Campus',
  '20260506_163935': 'Rua da Pêga',
  '20260507_151920': 'Campus & Hospital Roundabout',
  '20260701_124734': 'Rua da Pêga',
  '20260713_173511': 'Campus & Hospital Roundabout',
  '20260714_161537': 'Ponte dos Botirões',
  '20260714_171427': 'Rossio',
  '20260714_174138': 'Praça do Peixe',
}

export const NOTES = {
  '20260506_152621': 'University of Aveiro campus and adjacent streets: five marked crossings and a roundabout, mixed-use with moderate traffic.',
  '20260506_163935': 'Out-and-back along Rua da Pêga beside Lago Siza Vieira, a quieter lakeside arterial with two crosswalks.',
  '20260507_151920': 'The most varied route: campus into the surrounding urban area during high traffic, including an unsignalised crossing.',
  '20260701_124734': 'A second pass along Rua da Pêga, repeating the Run 2 route on a different day.',
  '20260713_173511': 'Repeats the Run 3 route (campus into the surrounding urban area and the hospital roundabout) on a different day.',
  '20260714_161537': 'The busier Ponte dos Botirões area, with dense vehicle traffic.',
  '20260714_171427': 'The Rossio, one of the busiest, most touristic areas of central Aveiro, beside the canal (boats and buses appear).',
  '20260714_174138': 'The historic centre around Praça do Peixe, a compact, pedestrian-dense area.',
}

export const zoneOf = (id) => ZONES[id] || 'Urban route'
export const noteOf = (id) => NOTES[id] || 'A wearable HoloLens 2 recording of an urban pedestrian route.'
