import { Object } from "../object.js";

function main() {
    var CANVAS = document.getElementById('myCanvas');
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    // ========== OBJECT DRAG START ==========
    var THETA = 0, PHI = 0;
    var drag = false;
    var x_prev, y_prev;
    var FRICTION = 0.05;
    var dX = 0, dY = 0;
    var SPEED = 0.05;
    var zoom = -8;

    var mouseDown = function (e) {
        drag = true;
        x_prev = e.clientX;
        y_prev = e.clientY;
        e.preventDefault();
        return false;
    };

    var mouseUp = function (e) {
        drag = false;
    };

    var mouseMove = function (e) {
        if (!drag) return false;
        dX = (e.clientX - x_prev) * 2 * Math.PI / CANVAS.width;
        dY = (e.clientY - y_prev) * 2 * Math.PI / CANVAS.height;
        THETA += dX;
        PHI += dY;
        x_prev = e.clientX;
        y_prev = e.clientY;
        e.preventDefault();
    };

    var keyDown = function (e) {
        if (e.key === 'w') {
            dY -= SPEED;
        }
        else if (e.key === 'a') {
            dX -= SPEED;
        }
        else if (e.key === 's') {
            dY += SPEED;
        }
        else if (e.key === 'd') {
            dX += SPEED;
        }
    };

    var scroll = (e) => {
        if (e.deltaY < 0) {
            zoom += 0.5;
        } else {
            zoom -= 0.5;
        }
        e.preventDefault();
    };

    CANVAS.addEventListener("mousedown", mouseDown, false);
    CANVAS.addEventListener("mouseup", mouseUp, false);
    CANVAS.addEventListener("mouseout", mouseUp, false);
    CANVAS.addEventListener("mousemove", mouseMove, false);
    window.addEventListener("keydown", keyDown, false);
    CANVAS.addEventListener("wheel", scroll, false);
    // ========== OBJECT DRAG END ==========

    // ========== WEBGL SETUP START ==========
    var GL;
    try {
        GL = CANVAS.getContext("webgl", { antialias: true });
    } catch (e) {
        alert("WebGL context cannot be initialized");
        return false;
    }

    var shader_vertex_source = `
        attribute vec3 position;
        uniform mat4 Pmatrix, Vmatrix, Mmatrix;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
            gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.);
            vColor = color;
        }
    `;

    var shader_fragment_source = `
        precision mediump float;
        varying vec3 vColor;

        void main(void) {
            gl_FragColor = vec4(vColor, 1.);
        }
    `;

    var compile_shader = function (source, type, typeString) {
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            alert("ERROR IN " + typeString + " SHADER: " + GL.getShaderInfoLog(shader));
            return false;
        }
        return shader;
    }

    var shader_vertex = compile_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
    var shader_fragment = compile_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

    var SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(SHADER_PROGRAM, shader_vertex);
    GL.attachShader(SHADER_PROGRAM, shader_fragment);

    GL.linkProgram(SHADER_PROGRAM);

    var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
    GL.enableVertexAttribArray(_position);

    var _color = GL.getAttribLocation(SHADER_PROGRAM, "color");
    GL.enableVertexAttribArray(_color);

    var _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
    var _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
    var _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");

    GL.useProgram(SHADER_PROGRAM);
    // ========== WEBGL SETUP END ==========

    var PROJMATRIX = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 1, 100);
    var VIEWMATRIX = LIBS.get_I4();

    // ========== GENERATE SHAPE OBJECT START =========
    const { vertices: body_vertices, indices: body_indices } = generateEllipsoid(1.1, 1.3, 1.0, 30, 30, [1.0, 0.5, 0.0]);
    const body = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, body_vertices, body_indices);

    const { vertices: head_vertices, indices: head_indices } = generateEllipsoid(1.0, 1.0, 1.0, 30, 30, [1.0, 0.5, 0.0]);
    const head = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, head_vertices, head_indices);

    const { vertices: tail_vertices, indices: tail_indices } = generateCurvedCylinder(0.4, 0.2, 1.5, 20, 10, [1.0, 0.5, 0.0]);
    const tail = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tail_vertices, tail_indices);

    const { vertices: belly_vertices, indices: belly_indices } = generateEllipsoid(0.9, 1, 0.4, 30, 30, [1.0, 1.0, 0.6]);
    const belly = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, belly_vertices, belly_indices);

    const { vertices: leftarm_shoulder_vertices, indices: leftarm_shoulder_indices } = generateEllipsoid(0.3, 0.3, 0.3, 30, 30, [1.0, 0.5, 0.0]);
    const leftarmShoulder = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leftarm_shoulder_vertices, leftarm_shoulder_indices);

    const { vertices: leftarm_vertices, indices: leftarm_indices } = generateEllipsoid(0.6, 0.3, 0.3, 30, 30, [1.0, 0.5, 0.0]);
    const leftArm = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leftarm_vertices, leftarm_indices);

    const { vertices: rightarm_shoulder_vertices, indices: rightarm_shoulder_indices } = generateEllipsoid(0.3, 0.3, 0.3, 30, 30, [1.0, 0.5, 0.0]);
    const rightarmShoulder = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, rightarm_shoulder_vertices, rightarm_shoulder_indices);

    const { vertices: rightarm_vertices, indices: rightarm_indices } = generateEllipsoid(0.6, 0.3, 0.3, 30, 30, [1.0, 0.5, 0.0]);
    const rightArm = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, rightarm_vertices, rightarm_indices);

    const { vertices: leftleg_vertices, indices: leftleg_indices } = generateEllipsoid(0.4, 0.8, 0.4, 30, 30, [1.0, 0.5, 0.0]);
    const leftLeg = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leftleg_vertices, leftleg_indices);

    const { vertices: rightleg_vertices, indices: rightleg_indices } = generateEllipsoid(0.4, 0.8, 0.4, 30, 30, [1.0, 0.5, 0.0]);
    const rightLeg = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, rightleg_vertices, rightleg_indices);

    const { vertices: leftleg_ankle_vertices, indices: leftleg_ankle_indices } = generateEllipsoid(0.3, 0.3, 0.3, 30, 30, [1.0, 0.5, 0.0]);
    const leftLegAnkle = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leftleg_ankle_vertices, leftleg_ankle_indices);

    const { vertices: rightleg_ankle_vertices, indices: rightleg_ankle_indices } = generateEllipsoid(0.3, 0.3, 0.3, 30, 30, [1.0, 0.5, 0.0]);
    const rightLegAnkle = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, rightleg_ankle_vertices, rightleg_ankle_indices);

    const { vertices: leftleg_foot_vertices, indices: leftleg_foot_indices } = generateEllipsoid(0.35, 0.2, 0.5, 30, 30, [1.0, 0.5, 0.0]);
    const leftLegFoot = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leftleg_foot_vertices, leftleg_foot_indices);

    const { vertices: rightleg_foot_vertices, indices: rightleg_foot_indices } = generateEllipsoid(0.35, 0.2, 0.5, 30, 30, [1.0, 0.5, 0.0]);
    const rightLegFoot = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, rightleg_foot_vertices, rightleg_foot_indices);
    // ========== GENERATE SHAPE OBJECT END ==========

    // ========== ROTATE SCALE TRANSLATE START ==========
    LIBS.translateY(head.MOVE_MATRIX, 1.6);
    LIBS.translateZ(head.MOVE_MATRIX, 0.1);

    LIBS.translateY(tail.MOVE_MATRIX, 0.6);
    LIBS.translateZ(tail.MOVE_MATRIX, -0.8);
    LIBS.rotateX(tail.MOVE_MATRIX, -Math.PI / 3);
    LIBS.rotateY(tail.MOVE_MATRIX, Math.PI);

    LIBS.translateY(belly.MOVE_MATRIX, -0.2);
    LIBS.translateZ(belly.MOVE_MATRIX, 0.59);
    LIBS.rotateX(belly.MOVE_MATRIX, Math.PI / 16);

    LIBS.translateX(leftarmShoulder.MOVE_MATRIX, 0.9);
    LIBS.translateY(leftarmShoulder.MOVE_MATRIX, 0.6);

    LIBS.translateX(leftArm.MOVE_MATRIX, 0.3);
    LIBS.translateY(leftArm.MOVE_MATRIX, 0.37);
    LIBS.translateZ(leftArm.MOVE_MATRIX, -0.3);
    LIBS.rotateY(leftArm.MOVE_MATRIX, LIBS.degToRad(-30));
    LIBS.rotateZ(leftArm.MOVE_MATRIX, LIBS.degToRad(-30));

    LIBS.translateX(rightarmShoulder.MOVE_MATRIX, -0.9);
    LIBS.translateY(rightarmShoulder.MOVE_MATRIX, 0.6);

    LIBS.translateX(rightArm.MOVE_MATRIX, -0.3);
    LIBS.translateY(rightArm.MOVE_MATRIX, 0.37);
    LIBS.translateZ(rightArm.MOVE_MATRIX, -0.3);
    LIBS.rotateY(rightArm.MOVE_MATRIX, LIBS.degToRad(30));
    LIBS.rotateZ(rightArm.MOVE_MATRIX, LIBS.degToRad(30));

    LIBS.translateX(leftLeg.MOVE_MATRIX, 0.7);
    LIBS.translateY(leftLeg.MOVE_MATRIX, -0.8);

    LIBS.translateX(rightLeg.MOVE_MATRIX, -0.7);
    LIBS.translateY(rightLeg.MOVE_MATRIX, -0.8);

    LIBS.translateY(leftLegAnkle.MOVE_MATRIX, -0.55);

    LIBS.translateY(rightLegAnkle.MOVE_MATRIX, -0.55);

    LIBS.translateX(leftLegFoot.MOVE_MATRIX, 0.1);
    LIBS.translateY(leftLegFoot.MOVE_MATRIX, -0.15);
    LIBS.translateZ(leftLegFoot.MOVE_MATRIX, 0.45);
    LIBS.rotateY(leftLegFoot.MOVE_MATRIX, LIBS.degToRad(20));

    LIBS.translateX(rightLegFoot.MOVE_MATRIX, -0.1);
    LIBS.translateY(rightLegFoot.MOVE_MATRIX, -0.15);
    LIBS.translateZ(rightLegFoot.MOVE_MATRIX, 0.45);
    LIBS.rotateY(rightLegFoot.MOVE_MATRIX, LIBS.degToRad(-20));
    // ========== ROTATE SCALE TRANSLATE END ==========

    // ========== CHILDS PUSH START ==========
    body.addChild(head);
    body.addChild(tail);
    body.addChild(belly);
    body.addChild(leftarmShoulder);
    body.addChild(rightarmShoulder);
    body.addChild(leftLeg);
    body.addChild(rightLeg);
    leftarmShoulder.addChild(leftArm);
    rightarmShoulder.addChild(rightArm);
    leftLeg.addChild(leftLegAnkle);
    rightLeg.addChild(rightLegAnkle);
    leftLegAnkle.addChild(leftLegFoot);
    rightLegAnkle.addChild(rightLegFoot);
    // ========== CHIILDS PUSH END ==========

    // ========== SETUP START ==========
    body.setup();
    tail.setup();
    belly.setup();
    // ========== SETUP END ==========

    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.clearColor(0.0, 0.0, 0.0, 1.0);
    GL.clearDepth(1.0);

    var animate = function (time) {
        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        // ========== OBJECT DRAG START ==========
        if (!drag) {
            dX *= (1 - FRICTION);
            dY *= (1 - FRICTION);
            THETA += dX;
            PHI += dY;
        }
        // ========== OBJECT DRAG END ==========

        var MODELMATRIX = LIBS.get_I4();
        var VIEWMATRIX_dynamic = LIBS.get_I4();

        LIBS.translateZ(VIEWMATRIX_dynamic, zoom);
        LIBS.rotateY(VIEWMATRIX_dynamic, THETA);
        LIBS.rotateX(VIEWMATRIX_dynamic, PHI);

        LIBS.multiply(VIEWMATRIX_dynamic, VIEWMATRIX, VIEWMATRIX_dynamic);

        GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX_dynamic);
        GL.uniformMatrix4fv(_Mmatrix, false, MODELMATRIX);

        body.render(MODELMATRIX);

        GL.flush();
        window.requestAnimationFrame(animate);
    }

    animate(0);
}

window.addEventListener('load', main);