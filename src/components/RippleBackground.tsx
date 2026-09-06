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
    // Adapted from the supplied Stitch shader. Clamp fractional powers to
    // avoid undefined colors; retain the source's layered, flowing wave field.
    gl.shaderSource(
      fragment,
      `precision mediump float;
      uniform vec2 u_resolution; uniform vec2 u_mouse;
      uniform float u_time; uniform vec3 u_click; uniform float u_energy;
      void main(){
        vec2 uv=(gl_FragCoord.xy*2.-u_resolution)/min(u_resolution.x,u_resolution.y);
        vec2 mouse=(u_mouse*2.-u_resolution)/min(u_resolution.x,u_resolution.y);
        float d=length(uv-mouse);
        float ripple=(sin(d*20.-u_time*5.)+.55*sin(d*33.-u_time*7.))*exp(-d*1.7);
        vec2 p=uv*1.3+vec2(ripple*.18*u_energy,ripple*.12*u_energy);
        float t=u_time*.28;
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
        col+=mix(purple,cyan,.5+.5*sin(d*9.-u_time))*pow(abs(ripple),2.)*.48*u_energy;
        vec2 click=(u_click.xy*2.-u_resolution)/min(u_resolution.x,u_resolution.y);
        float age=u_time-u_click.z;
        if(age>=0. && age<3.){
          float dist=length(uv-click);
          float front=dist-age*.65;
          float rings=pow(.5+.5*sin(front*29.),3.)*exp(-front*front*5.);
          col+=mix(purple,cyan,.5+.5*sin(dist*6.))*rings*(1.-age/3.)*.75;
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
    const mouseLoc = gl.getUniformLocation(program, "u_mouse"),
      clickLoc = gl.getUniformLocation(program, "u_click"),
      energyLoc = gl.getUniformLocation(program, "u_energy");
    let frame = 0,
      lastFrame = 0,
      elapsed = 0,
      lastActive = 0,
      energy = 0;
    let target = { x: 0.5, y: 0.5 },
      mouse = { ...target },
      click = { x: 0, y: 0, at: -100 };
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
        mouse.x += (target.x - mouse.x) * 0.22;
        mouse.y += (target.y - mouse.y) * 0.22;
        energy +=
          (Math.max(0.12, 1 - (performance.now() - lastActive) / 2500) -
            energy) *
          0.15;
        gl.uniform2f(res, canvas.width, canvas.height);
        gl.uniform1f(time, elapsed);
        gl.uniform2f(mouseLoc, mouse.x * canvas.width, mouse.y * canvas.height);
        gl.uniform3f(
          clickLoc,
          click.x * canvas.width,
          click.y * canvas.height,
          click.at,
        );
        gl.uniform1f(energyLoc, energy);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      frame = requestAnimationFrame(draw);
    };
    const move = (event: PointerEvent) => {
      target = {
        x: event.clientX / innerWidth,
        y: 1 - event.clientY / innerHeight,
      };
      lastActive = performance.now();
      if (event.type === "pointerdown") click = { ...target, at: elapsed };
    };
    const sync = () => {
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
    document.addEventListener("visibilitychange", sync);
    media.addEventListener("change", sync);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
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
