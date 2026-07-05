"use client";

import { useEffect, useRef } from "react";
import {
  buildField,
  computeSmokeLayout,
  ensureSmokeFontsReady,
  measureFieldWords,
  type SmokeLayout,
} from "@/components/home/hero-smoke-field";
import { readMaskFont } from "@/components/home/hero-word-measure";
import "./hero-title-smoke-gl.css";

type HeroTitleSmokeGLProps = {
  titleRef: React.RefObject<HTMLElement | null>;
};

const VERT = `
attribute vec2 aPos;
attribute vec2 aUv;
varying vec2 vUv;
void main(){
  vUv = aUv;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
uniform sampler2D uField;
uniform float uTime, uFade, uSplitX, uSplitY, uStacked, uLetterH;
uniform vec2 uRes;
varying vec2 vUv;

const float NOISE_SCALE = 1.0;
const float WISP        = 1.3;
const float FIELD_GAIN  = 1.2;
const float NEAR_POW    = 2.2;
const float BRIGHT      = 1.7;
const float ALPHA_CAP   = 0.8;
const float BLUR_NEAR   = 1.0;
const float SPEED       = 1.0;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), u.x),
             mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i=0;i<5;i++){ v += a*noise(p); p = p*2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

void main(){
  vec2 p = (vUv * uRes) / uLetterH * NOISE_SCALE;
  float t = uTime * SPEED;

  vec2 q = vec2(fbm(p + t*0.04), fbm(p + vec2(5.2,1.3) - t*0.03));
  vec2 r = vec2(fbm(p + 4.0*q + t*0.05), fbm(p + 4.0*q + vec2(8.3,2.8)));
  vec2 pw = p + 3.5*r + vec2(0.0, t*0.03);

  float field = clamp(texture2D(uField, vUv).r * FIELD_GAIN, 0.0, 1.0);
  float nearF = pow(field, NEAR_POW);

  float sSharp = fbm(pw);
  float sSoft  = fbm(pw * 0.45);
  float texSharp = smoothstep(0.30, 0.80, sSharp);
  float texSoft  = smoothstep(0.05, 0.95, sSoft);
  float blurAmt  = clamp(nearF * BLUR_NEAR, 0.0, 1.0);
  float tex = mix(texSharp, texSoft, blurAmt);

  float density = clamp(tex * field * WISP, 0.0, 1.0);

  float side = uStacked > 0.5
    ? smoothstep(uSplitY - 0.08, uSplitY + 0.08, vUv.y)
    : smoothstep(uSplitX - 0.06, uSplitX + 0.06, vUv.x);
  vec3 tube = mix(vec3(0.72, 0.86, 1.00), vec3(0.16, 0.78, 1.00), side);
  vec3 base = mix(vec3(0.012, 0.050, 0.070), vec3(0.020, 0.090, 0.130), side);

  vec3 col = mix(base, tube, clamp(nearF * density * BRIGHT, 0.0, 1.0));
  float alpha = clamp(density * (0.55 + 0.45 * nearF), 0.0, ALPHA_CAP) * uFade;

  gl_FragColor = vec4(col * alpha, alpha);
}`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn("Shader compile:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function createProgram(gl: WebGLRenderingContext) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn("Program link:", gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

const INTERNAL_SCALE_DESKTOP = 0.5;

function getInternalScale(): number {
  if (typeof window === "undefined") return INTERNAL_SCALE_DESKTOP;
  const narrow = window.innerWidth < 720;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (!narrow) return INTERNAL_SCALE_DESKTOP;
  return Math.min(1, Math.max(0.72, INTERNAL_SCALE_DESKTOP * dpr));
}

function isMobileViewport(): boolean {
  return typeof window !== "undefined" && window.innerWidth < 720;
}

/** Humo volumétrico WebGL — campo único + shader definitivo. */
export default function HeroTitleSmokeGL({ titleRef }: HeroTitleSmokeGLProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const glCanvas = canvasRef.current;
    const titleEl = titleRef.current;
    if (!wrap || !glCanvas || !titleEl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const gl =
      glCanvas.getContext("webgl", { alpha: true, premultipliedAlpha: true }) ??
      glCanvas.getContext("experimental-webgl", { alpha: true, premultipliedAlpha: true });

    if (!gl) return;

    const webgl = gl as WebGLRenderingContext;
    const program = createProgram(webgl);
    if (!program) return;

    webgl.useProgram(program);

    const buf = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, buf);
    webgl.bufferData(
      webgl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, -1, 1, 0, 1, 1, 1, 1, -1, 1, 0, 1,
      ]),
      webgl.STATIC_DRAW,
    );

    const stride = 16;
    const aPos = webgl.getAttribLocation(program, "aPos");
    const aUv = webgl.getAttribLocation(program, "aUv");
    webgl.enableVertexAttribArray(aPos);
    webgl.vertexAttribPointer(aPos, 2, webgl.FLOAT, false, stride, 0);
    webgl.enableVertexAttribArray(aUv);
    webgl.vertexAttribPointer(aUv, 2, webgl.FLOAT, false, stride, 8);

    const uField = webgl.getUniformLocation(program, "uField");
    const uTime = webgl.getUniformLocation(program, "uTime");
    const uFade = webgl.getUniformLocation(program, "uFade");
    const uSplitX = webgl.getUniformLocation(program, "uSplitX");
    const uSplitY = webgl.getUniformLocation(program, "uSplitY");
    const uStacked = webgl.getUniformLocation(program, "uStacked");
    const uLetterH = webgl.getUniformLocation(program, "uLetterH");
    const uRes = webgl.getUniformLocation(program, "uRes");

    const texField = webgl.createTexture();
    if (texField) {
      webgl.bindTexture(webgl.TEXTURE_2D, texField);
      webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_S, webgl.CLAMP_TO_EDGE);
      webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_T, webgl.CLAMP_TO_EDGE);
      webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MIN_FILTER, webgl.LINEAR);
      webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MAG_FILTER, webgl.LINEAR);
    }

    webgl.enable(webgl.BLEND);
    webgl.blendFunc(webgl.ONE, webgl.ONE_MINUS_SRC_ALPHA);

    let clientW = 0;
    let clientH = 0;
    let layout: SmokeLayout = { stacked: false, splitX: 0.5, splitY: 0.5 };
    let letterH = 1;
    let internalScale = INTERNAL_SCALE_DESKTOP;
    let raf = 0;
    let running = true;
    let visible = true;
    let fadeStart = performance.now();
    let lastFrame = 0;
    let debounceTimer = 0;

    const uploadField = (source: HTMLCanvasElement) => {
      if (!texField) return;
      webgl.bindTexture(webgl.TEXTURE_2D, texField);
      webgl.pixelStorei(webgl.UNPACK_FLIP_Y_WEBGL, true);
      webgl.texImage2D(
        webgl.TEXTURE_2D,
        0,
        webgl.RGBA,
        webgl.RGBA,
        webgl.UNSIGNED_BYTE,
        source,
      );
    };

    const buildPresence = async () => {
      if (clientW <= 0 || clientH <= 0) return;

      await ensureSmokeFontsReady(titleEl);

      const words = measureFieldWords(titleEl);
      if (!words.length) return;

      const maskFont = readMaskFont(titleEl);
      const fontSizeCss = parseFloat(getComputedStyle(titleEl).fontSize);
      internalScale = getInternalScale();
      letterH = Math.max(1, fontSizeCss * internalScale);

      const fieldCanvas = buildField(glCanvas, wrap, words, maskFont, {
        mobile: isMobileViewport(),
      });
      layout = computeSmokeLayout(words, wrap);
      uploadField(fieldCanvas);
    };

    const schedulePresence = () => {
      void buildPresence();
    };

    const resize = () => {
      internalScale = getInternalScale();
      const rect = wrap.getBoundingClientRect();
      clientW = rect.width;
      clientH = rect.height;
      glCanvas.width = Math.max(1, Math.floor(clientW * internalScale));
      glCanvas.height = Math.max(1, Math.floor(clientH * internalScale));
      glCanvas.style.width = `${clientW}px`;
      glCanvas.style.height = `${clientH}px`;
      webgl.viewport(0, 0, glCanvas.width, glCanvas.height);
      schedulePresence();
    };

    const debouncedResize = () => {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(resize, 200);
    };

    const ro = new ResizeObserver(debouncedResize);
    ro.observe(wrap);
    ro.observe(titleEl);
    resize();

    const mobileTimer1 = isMobileViewport()
      ? window.setTimeout(schedulePresence, 350)
      : 0;
    const mobileTimer2 = isMobileViewport()
      ? window.setTimeout(schedulePresence, 900)
      : 0;

    const onFontsDone = () => schedulePresence();
    document.fonts.addEventListener("loadingdone", onFontsDone);
    void document.fonts.ready.then(schedulePresence);

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 },
    );
    io.observe(wrap);

    const onVis = () => {
      if (!document.hidden && visible) {
        lastFrame = 0;
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const loop = (t: number) => {
      if (!running) return;
      if (!visible || document.hidden) {
        raf = requestAnimationFrame(loop);
        return;
      }

      if (!reduced && t - lastFrame < 33) {
        raf = requestAnimationFrame(loop);
        return;
      }
      lastFrame = t;

      const elapsed = (t - fadeStart) * 0.001;
      const fade = easeOutCubic(Math.min(1, elapsed / 2.5));
      const timeSec = reduced ? 7.0 : t * 0.001;

      webgl.clearColor(0, 0, 0, 0);
      webgl.clear(webgl.COLOR_BUFFER_BIT);

      webgl.useProgram(program);
      webgl.activeTexture(webgl.TEXTURE0);
      webgl.bindTexture(webgl.TEXTURE_2D, texField);
      if (uField) webgl.uniform1i(uField, 0);
      webgl.uniform1f(uTime, timeSec);
      webgl.uniform1f(uFade, reduced ? 1 : fade);
      webgl.uniform1f(uSplitX, layout.splitX);
      webgl.uniform1f(uSplitY, layout.splitY);
      webgl.uniform1f(uStacked, layout.stacked ? 1 : 0);
      webgl.uniform1f(uLetterH, letterH);
      webgl.uniform2f(uRes, glCanvas.width, glCanvas.height);
      webgl.drawArrays(webgl.TRIANGLES, 0, 6);

      if (reduced) return;
      raf = requestAnimationFrame(loop);
    };

    fadeStart = performance.now();
    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(debounceTimer);
      window.clearTimeout(mobileTimer1);
      window.clearTimeout(mobileTimer2);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      document.fonts.removeEventListener("loadingdone", onFontsDone);
      webgl.deleteProgram(program);
      webgl.deleteBuffer(buf);
      if (texField) webgl.deleteTexture(texField);
    };
  }, [titleRef]);

  return (
    <div ref={wrapRef} className="hero-smoke-gl" aria-hidden>
      <canvas ref={canvasRef} />
    </div>
  );
}
