"use client";

import { useEffect, useRef } from "react";

// Short-lived wave impulses keep the backdrop idle when no one is interacting.
export function RippleBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
    });
    if (!gl) return;
    const vertex = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(
      vertex,
      "attribute vec2 p; void main(){gl_Position=vec4(p,0.,1.);}",
    );
    gl.compileShader(vertex);
    const fragment = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(
      fragment,
      `precision mediump float;
      uniform vec2 resolution; uniform vec4 waves[8]; uniform float time;
      void main(){ vec2 uv=gl_FragCoord.xy/resolution; float light=0.;
        for(int i=0;i<8;i++){ float age=time-waves[i].z;
          if(age>=0. && age<2.4){ vec2 d=(uv-waves[i].xy)*vec2(resolution.x/resolution.y,1.);
            float radius=length(d); float ring=exp(-pow((radius-age*.18)*45.,2.));
            light+=ring*(1.-age/2.4)*waves[i].w; }
        }
        vec3 color=mix(vec3(0.,.94,1.),vec3(.54,.17,.89),uv.x);
        gl_FragColor=vec4(color,min(light*.2,.32)); }`,
    );
    gl.compileShader(fragment);
    const program = gl.createProgram()!;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteProgram(program);
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const res = gl.getUniformLocation(program, "resolution"),
      time = gl.getUniformLocation(program, "time"),
      points = gl.getUniformLocation(program, "waves[0]");
    const waves = new Float32Array(32);
    let cursor = 0,
      frame = 0,
      last = 0,
      lastWave = -10;
    const origin = performance.now();
    const seconds = () => (performance.now() - origin) / 1000;
    const resize = () => {
      const scale = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = Math.round(innerWidth * scale);
      canvas.height = Math.round(innerHeight * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const render = () => {
      gl.uniform2f(res, canvas.width, canvas.height);
      gl.uniform1f(time, seconds());
      gl.uniform4fv(points, waves);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      frame =
        seconds() - lastWave < 2.5 && !document.hidden && !media.matches
          ? requestAnimationFrame(render)
          : 0;
    };
    const move = (event: PointerEvent) => {
      if (
        media.matches ||
        document.hidden ||
        (event.type === "pointermove" && performance.now() - last < 110)
      )
        return;
      last = performance.now();
      lastWave = seconds();
      waves.set(
        [
          event.clientX / innerWidth,
          1 - event.clientY / innerHeight,
          lastWave,
          event.type === "pointerdown" ? 1.8 : 0.7,
        ],
        cursor * 4,
      );
      cursor = (cursor + 1) % 8;
      if (!frame) frame = requestAnimationFrame(render);
    };
    const clear = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      waves.fill(0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    document.addEventListener("visibilitychange", clear);
    media.addEventListener("change", clear);
    return () => {
      clear();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      document.removeEventListener("visibilitychange", clear);
      media.removeEventListener("change", clear);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);
  return <canvas className="ripple-background" ref={ref} aria-hidden="true" />;
}
