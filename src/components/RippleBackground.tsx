"use client";
import { useEffect, useRef } from "react";

export function RippleBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
    });
    if (!gl) return;
    const vertex = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(
      vertex,
      "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}",
    );
    gl.compileShader(vertex);
    const fragment = gl.createShader(gl.FRAGMENT_SHADER)!;
    // Keep the background still; pointer samples briefly tint only nearby pixels.
    gl.shaderSource(
      fragment,
      `precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time; uniform vec3 u_click;
      uniform vec4 u_trail[12]; uniform vec2 u_birth[12];
      void main(){
        vec2 uv=(gl_FragCoord.xy*2.-u_resolution)/min(u_resolution.x,u_resolution.y);
        float glow=0.;
        for(int i=0;i<12;i++){
          float age=u_time-u_birth[i].x;
          if(u_birth[i].y>0. && age>=0. && age<1.8){
            vec2 a=(u_trail[i].xy*2.-1.)*u_resolution/min(u_resolution.x,u_resolution.y);
            vec2 b=(u_trail[i].zw*2.-1.)*u_resolution/min(u_resolution.x,u_resolution.y);
            vec2 segment=b-a;
            float along=clamp(dot(uv-a,segment)/max(dot(segment,segment),.00001),0.,1.);
            float d=length(uv-a-segment*along);
            float fade=pow(1.-age/1.8,2.);
            glow+=exp(-d*d/.045)*fade;
          }
        }
        vec2 p=uv*1.3;
        float t=.7;
        float w1=sin(p.x*2.2+t+sin(p.y*1.8+t*.8));
        float w2=cos(p.y*2.5-t*.9+cos(p.x*2.-t*.7));
        float w3=sin((p.x+p.y)*1.5+t*1.2);
        float fluid=clamp((w1+w2+w3)*.25+.5,0.,1.);
        vec3 cyan=vec3(0.,.94,1.), purple=vec3(.54,.17,.88);
        vec3 col=vec3(.039,.055,.09);
        col+=cyan*pow(fluid,3.2)*.40;
        col+=purple*pow(1.-fluid,3.)*.42;
        col+=vec3(0.,1.,.64)*pow(abs(sin(p.x*3.+t)),4.)*.035;
        col*=clamp(1.-length(uv)*.20,.35,1.);
        col=mix(col,col+mix(purple,cyan,.65)*.16,1.-exp(-glow));
        vec2 click=(u_click.xy*2.-u_resolution)/min(u_resolution.x,u_resolution.y);
        float age=u_time-u_click.z;
        if(age>=0. && age<3.){
          float dist=length(uv-click);
          col+=mix(purple,cyan,.65)*exp(-dist*dist/.045)*pow(1.-age/3.,2.)*.08;
        }
        gl_FragColor=vec4(col,1.);
      }`,
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
    const pos = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const res = gl.getUniformLocation(program, "u_resolution"),
      time = gl.getUniformLocation(program, "u_time");
    const trailLoc = gl.getUniformLocation(program, "u_trail[0]"),
      birthLoc = gl.getUniformLocation(program, "u_birth[0]"),
      clickLoc = gl.getUniformLocation(program, "u_click");
    const trail = new Float32Array(48), birth = new Float32Array(24);
    let frame = 0,
      lastFrame = 0,
      elapsed = 0,
      slot = 0;
    let previous: { x: number; y: number; at: number } | null = null;
    let click = { x: 0, y: 0, at: -100 };
    const resize = () => {
      const scale = Math.min(devicePixelRatio, 1.25, 1440 / innerWidth);
      canvas.width = Math.round(innerWidth * scale);
      canvas.height = Math.round(innerHeight * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const draw = (now: number) => {
      frame = 0;
      if (document.hidden || media.matches) return;
      if (now - lastFrame >= 1000 / 30) {
        elapsed += Math.min((now - lastFrame) / 1000, 0.05);
        lastFrame = now;
        gl.uniform2f(res, canvas.width, canvas.height);
        gl.uniform1f(time, elapsed);
        gl.uniform4fv(trailLoc, trail);
        gl.uniform2fv(birthLoc, birth);
        gl.uniform3f(
          clickLoc,
          click.x * canvas.width,
          click.y * canvas.height,
          click.at,
        );
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      frame = requestAnimationFrame(draw);
    };
    const move = (event: PointerEvent) => {
      if (document.hidden || media.matches || !event.isPrimary) return;
      const target = {
        x: event.clientX / innerWidth,
        y: 1 - event.clientY / innerHeight,
        at: performance.now(),
      };
      if (event.type === "pointerdown") {
        click = { ...target, at: elapsed };
        previous = target;
        return;
      }
      if (previous && target.at - previous.at < 40) return;
      if (previous && Math.hypot((target.x-previous.x)*innerWidth, (target.y-previous.y)*innerHeight) < 3) return;
      // Each deposited segment is immutable until its ring-buffer slot is reused.
      const start = previous && target.at - previous.at < 180 ? previous : target;
      trail.set([start.x, start.y, target.x, target.y], slot * 4);
      birth.set([elapsed, 1], slot * 2);
      slot = (slot + 1) % 12;
      previous = target;
    };
    const leave = () => { previous = null; };
    const sync = () => {
      leave();
      cancelAnimationFrame(frame);
      frame = 0;
      if (!document.hidden && !media.matches) {
        lastFrame = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };
    resize();
    sync();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    document.addEventListener("visibilitychange", sync);
    media.addEventListener("change", sync);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      document.removeEventListener("visibilitychange", sync);
      media.removeEventListener("change", sync);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);
  return <canvas className="ripple-background" ref={ref} aria-hidden="true" />;
}
