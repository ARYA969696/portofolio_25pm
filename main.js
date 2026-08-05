        // Custom Cursor Logic
        const cursorDot = document.getElementById('cursorDot');
        const interactives = document.querySelectorAll('.interactive, a, button');

        if (window.matchMedia("(min-width: 768px)").matches) {
            document.addEventListener('mousemove', (e) => {
                cursorDot.style.left = e.clientX + 'px';
                cursorDot.style.top = e.clientY + 'px';
            });

            interactives.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    cursorDot.classList.add('hover');
                });
                el.addEventListener('mouseleave', () => {
                    cursorDot.classList.remove('hover');
                });
            });
        }

        // Skills Cursor Interactive Logic
        const skillsContainer = document.getElementById('skills-interactive');
        const orbitCenter = document.getElementById('cursor-orbit-center');
        const skillNodes = document.querySelectorAll('.skill-node-interactive');
        
        // Orbital arc full circle, scaled down
        const radius = window.innerWidth < 800 ? 200 : 210; 
        let globalTime = 0;
        let isHoveringNode = false;

        skillNodes.forEach((node, index) => {
            // Space the 10 nodes evenly across the 360 degree circle
            const spacing = 360 / skillNodes.length;
            node.dataset.baseAngle = (index * spacing);
            
            node.addEventListener('mouseenter', () => isHoveringNode = true);
            node.addEventListener('mouseleave', () => isHoveringNode = false);
        });

        if (skillsContainer && orbitCenter) {
            function animateOrbit() {
                if (!isHoveringNode) {
                    globalTime += 0.25; // Speed of orbit
                }
                
                skillNodes.forEach((node) => {
                    const baseAngle = parseFloat(node.dataset.baseAngle || 0);
                    let currentAngle = (baseAngle + globalTime) % 360;
                    
                    const radian = currentAngle * (Math.PI / 180);
                    const x = radius * Math.cos(radian);
                    const y = radius * Math.sin(radian);
                    
                    node.style.transform = `translate(${x}px, ${y}px)`;
                    node.style.opacity = '1';
                    node.style.pointerEvents = 'auto';
                });
                
                requestAnimationFrame(animateOrbit);
            }
            
            animateOrbit();
        }
        
        // Scroll Reveal Observer
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
            const revealElements = document.querySelectorAll('.reveal-up, .reveal-down, .reveal-fade, .stagger-card');
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (entry.target.classList.contains('stagger-card')) {
                            entry.target.style.transitionDelay = `${entry.target.dataset.delay}ms`;
                        }
                        entry.target.classList.add('active');
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
            
            revealElements.forEach(el => revealObserver.observe(el));
            
            // Trigger hero immediately if it's already in view
            setTimeout(() => {
                const hero = document.getElementById('hero');
                if (hero) hero.classList.add('active');
            }, 100);
        } else {
            // Fallback for reduced motion
            document.querySelectorAll('.reveal-up, .reveal-down, .reveal-fade, .stagger-card').forEach(el => el.classList.add('active'));
        }

        // WebGL Shader Background
        const canvas = document.getElementById('hero-shader');
        if (canvas) {
            const gl = canvas.getContext('webgl');
            if (gl) {
                const vsSource = `
                    attribute vec4 a_position;
                    varying vec2 v_texCoord;
                    void main() {
                        gl_Position = a_position;
                        v_texCoord = a_position.xy * 0.5 + 0.5;
                    }
                `;
                const fsSource = `
precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec4(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw), 0.0), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
    vec2 uv = v_texCoord;
    
    // Abstract fluid motion
    float n = snoise(uv * 3.0 + u_time * 0.2);
    n += 0.5 * snoise(uv * 6.0 - u_time * 0.3);
    
    // Aesthetic colors from design system (Purple/Lavendar #bd93f9)
    vec3 color1 = vec3(0.74, 0.58, 0.98); // #bd93f9
    vec3 color2 = vec3(0.1, 0.05, 0.2);   // Dark deep purple
    vec3 color3 = vec3(0.4, 0.2, 0.7);   // Mid purple
    
    vec3 finalColor = mix(color1, color2, n * 0.5 + 0.5);
    finalColor = mix(finalColor, color3, snoise(uv * 2.0 + u_time * 0.1));
    
    // Add some glow/vibrancy
    finalColor += color1 * 0.2 * (0.5 + 0.5 * sin(u_time + uv.x * 10.0));
    
    gl_FragColor = vec4(finalColor, 0.6); // Slightly transparent
}
                `;
                
                const vs = gl.createShader(gl.VERTEX_SHADER);
                gl.shaderSource(vs, vsSource);
                gl.compileShader(vs);

                const fs = gl.createShader(gl.FRAGMENT_SHADER);
                gl.shaderSource(fs, fsSource);
                gl.compileShader(fs);

                const program = gl.createProgram();
                gl.attachShader(program, vs);
                gl.attachShader(program, fs);
                gl.linkProgram(program);
                gl.useProgram(program);

                const positionBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                const positions = [
                  -1.0,  1.0,
                   1.0,  1.0,
                  -1.0, -1.0,
                   1.0, -1.0,
                ];
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

                const positionLocation = gl.getAttribLocation(program, "a_position");
                gl.enableVertexAttribArray(positionLocation);
                gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

                const timeLocation = gl.getUniformLocation(program, "u_time");
                const resolutionLocation = gl.getUniformLocation(program, "u_resolution");

                function render(time) {
                    time *= 0.001; 
                    
                    const displayWidth  = canvas.clientWidth;
                    const displayHeight = canvas.clientHeight;
                    if (canvas.width  !== displayWidth ||
                        canvas.height !== displayHeight) {
                      canvas.width  = displayWidth;
                      canvas.height = displayHeight;
                    }
                    
                    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
                    
                    gl.uniform1f(timeLocation, time);
                    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
                    
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                    requestAnimationFrame(render);
                }
                requestAnimationFrame(render);
            }
        }

        const about3dCard = document.getElementById('about3dCard');
        const about3dScene = document.querySelector('.about-3d-scene');

        if (about3dCard && about3dScene) {
            const rotationStrength = 18;
            let isFlipped = false;

            const updateCardTransform = (rotateX, rotateY, scale) => {
                const flipRotation = isFlipped ? 180 : 0;
                about3dCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY + flipRotation}deg) scale(${scale})`;
            };

            about3dScene.addEventListener('mousemove', (event) => {
                const rect = about3dScene.getBoundingClientRect();
                const posX = event.clientX - rect.left;
                const posY = event.clientY - rect.top;
                const rotateY = ((posX / rect.width) - 0.5) * rotationStrength;
                const rotateX = ((posY / rect.height) - 0.5) * -rotationStrength;

                updateCardTransform(rotateX, rotateY, 1.03);
            });

            about3dScene.addEventListener('mouseleave', () => {
                updateCardTransform(0, 0, 1);
            });

            about3dScene.addEventListener('click', () => {
                isFlipped = !isFlipped;
                updateCardTransform(0, 0, 1.03);
            });
        }
