const canvas = document.querySelector("canvas")!;

// WebGPU device initialization
if (!navigator.gpu) {
  throw new Error("WebGPU not supported on this browser.");
}

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
  throw new Error("No appropriate GPUAdapter found.");
}

const device = await adapter.requestDevice();

// Canvas configuration
const context = canvas.getContext("webgpu")!;
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({
  device: device,
  format: canvasFormat,
});

// Create a buffer with the vertices for a single cell.
const vertices = new Float32Array([
  -1, 3, -1, -1, 3, -1, -0.8, -0.8, 0.8, 0.8, -0.8, 0.8,
]);
const vertexBuffer = device.createBuffer({
  label: "Cell vertices",
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, 0, vertices);

const vertexBufferLayout: GPUVertexBufferLayout = {
  arrayStride: 8,
  attributes: [
    {
      format: "float32x2",
      offset: 0,
      shaderLocation: 0, // Position. Matches @location(0) in the @vertex shader.
    },
  ],
};

// Create the shader that will render the cells.
const cellShaderModule = device.createShaderModule({
  label: "Cell shader",
  code: `
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
	`,
});

// Create a pipeline that renders the cell.
const cellPipeline = device.createRenderPipeline({
  label: "Cell pipeline",
  layout: "auto",
  vertex: {
    module: cellShaderModule,
    entryPoint: "vert_main",
    buffers: [vertexBufferLayout],
  },
  fragment: {
    module: cellShaderModule,
    entryPoint: "frag_main",
    targets: [
      {
        format: canvasFormat,
      },
    ],
  },
});

// Create a uniform buffer with the current screen dimensions and time
const uniforms = new Float32Array([
  canvas.width,
  canvas.height,
  performance.now(),
  0,
]);
const uniformBuffer = device.createBuffer({
  label: "My Uniforms",
  size: uniforms.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(uniformBuffer, 0, uniforms);

// Create a bind group to pass the uniform into the pipeline
const bindGroup = device.createBindGroup({
  label: "Cell renderer bind group",
  layout: cellPipeline.getBindGroupLayout(0),
  entries: [
    {
      binding: 0,
      resource: { buffer: uniformBuffer },
    },
  ],
});

// Clear the canvas with a render pass
const encoder = device.createCommandEncoder();

const pass = encoder.beginRenderPass({
  colorAttachments: [
    {
      view: context.getCurrentTexture().createView(),
      loadOp: "clear",
      clearValue: { r: 0, g: 0, b: 0.4, a: 1.0 },
      storeOp: "store",
    },
  ],
});

// Draw the square.
pass.setPipeline(cellPipeline);
pass.setBindGroup(0, bindGroup);
pass.setVertexBuffer(0, vertexBuffer);
pass.draw(vertices.length / 2);

pass.end();

device.queue.submit([encoder.finish()]);

setInterval(() => {
  const uniforms = new Float32Array([
    canvas.width,
    canvas.height,
    performance.now(),
    0,
  ]);
  const uniformBuffer = device.createBuffer({
    label: "My Uniforms",
    size: uniforms.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(uniformBuffer, 0, uniforms);

  // Create a bind group to pass the uniform into the pipeline
  const bindGroup = device.createBindGroup({
    label: "Cell renderer bind group",
    layout: cellPipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer },
      },
    ],
  });

  //
  //
  //
  //

  // Clear the canvas with a render pass
  const encoder = device.createCommandEncoder();

  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: { r: 0, g: 0, b: 0.4, a: 1.0 },
        storeOp: "store",
      },
    ],
  });

  pass.setPipeline(cellPipeline);
  pass.setBindGroup(0, bindGroup);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.draw(vertices.length / 2);

  pass.end();

  device.queue.submit([encoder.finish()]);
}, 1);
