export type Corner = { x: number; y: number }; // normalized 0..1

export type FilterPreset = 'original' | 'bw' | 'enhance';

export type CropState = {
  corners: [Corner, Corner, Corner, Corner]; // TL, TR, BR, BL
  rotation: number;
  scale: number;
  filter: FilterPreset;
};

