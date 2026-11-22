// Allège le GLB exporté par Blender pour la page : textures en WebP (couleur et relief au plus
// 1024 px, cartes de rugosité/occlusion au plus 512 px, petits objets au plus 512 px), sommets
// fusionnés, géométrie compressée (meshopt), doublons et restes supprimés.
// node optimiser.mjs <entrée.glb> <sortie.glb>
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, textureCompress, meshopt, weld, listTextureSlots } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import { statSync } from 'node:fs';

const [entree, sortie] = process.argv.slice(2);
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder
});
const doc = await io.read(entree);
const racine = doc.getRoot();

// textures des objets éclairés par sonde (petits objets) : 512 px suffisent
const petites = new Set();
for (const node of racine.listNodes()) {
  const mesh = node.getMesh();
  if (!mesh || node.getExtras()?.lumiere !== 'sonde') continue;
  for (const prim of mesh.listPrimitives()) {
    const mat = prim.getMaterial();
    if (!mat) continue;
    for (const t of [mat.getBaseColorTexture(), mat.getNormalTexture(), mat.getMetallicRoughnessTexture(), mat.getOcclusionTexture()]) if (t) petites.add(t);
  }
}
let i = 0;
for (const t of racine.listTextures()) { if (!t.getName()) t.setName('tex' + (i++)); }
const nomsPetites = new Set([...petites].map((t) => t.getName()));

await doc.transform(
  dedup(),
  prune({keepAttributes: true}),
  weld(),
);
// 1. petits objets : tout en 512
await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512], quality: 82,
  pattern: new RegExp('^(' + [...nomsPetites].map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')$') }));
// 1 bis. surfaces à peine vues (bûches, fond du foyer) : 256 ; relief des objets et des murs, cuir, briques, cadres : 512
await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [256, 256], quality: 82, pattern: /bark|buches|slate|ardoise/i }));
await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512], quality: 84, slots: /^normalTexture$/,
  pattern: /^(?!.*(herringbone|parquet|walnut|lambris|dark_wood|acajou|lacquered|noyer|livres)).*$/i }));
await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512], quality: 84, pattern: /cuir|leather|brique|frame_0|Armchair|clock|Chandelier/i }));
// 2. cartes de rugosité / occlusion : 512
await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512], quality: 85, slots: /^(metallicRoughnessTexture|occlusionTexture)$/ }));
// 3. le reste (couleur, relief des grandes surfaces) : 1024
await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 84 }));
await doc.transform(dedup(), prune({keepAttributes: true}), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(sortie, doc);

let tex = 0;
for (const t of racine.listTextures()) tex += t.getImage()?.byteLength || 0;
console.log('OPTIMISÉ', sortie, Math.round(statSync(sortie).size / 1024), 'Ko dont textures', Math.round(tex / 1024), 'Ko,',
  racine.listTextures().length, 'textures,', racine.listMeshes().length, 'maillages,', racine.listMaterials().length, 'matières');
