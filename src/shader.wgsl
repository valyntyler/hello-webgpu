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
  let aspect_ratio = width / height;

  let r = frag_coord.x / width;
  let g = frag_coord.y / height;

  return vec4f(0, 0, mandelbrot((r * aspect_ratio - 1) * 2, (g - 0.5) * 2), 1);
}

fn mandelbrot(x: f32, y: f32) -> f32 {
  var c = vec2f(x, y);
  var z = vec2f(0, 0);
  for (var i: i32 = 0; i < 100; i++) {
    if (length(z) > 2) {
      return 1;
    }
    let z_squared = vec2f(z.x * z.x - z.y * z.y, 2 * z.x * z.y);
    z = z_squared + c;
  }

  return 0;
}
