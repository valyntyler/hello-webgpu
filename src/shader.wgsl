struct MyUniforms {
  size: vec2f,
  time: f32,
};

@group(0) @binding(0) var<uniform> uniforms: MyUniforms;

@vertex
fn vert_main(@location(0) position: vec2f) -> @builtin(position) vec4f {
  return vec4f(position, 0, 1);
}

@fragment
fn frag_main(@builtin(position) frag_coord: vec4<f32>) -> @location(0) vec4f {
  let width = uniforms.size.x;
  let height = uniforms.size.y;
  let t = uniforms.time;

  return vec4f(frag_coord.x / width, frag_coord.y / height, (sin(t / 500) + 1) / 2, 1);
}
