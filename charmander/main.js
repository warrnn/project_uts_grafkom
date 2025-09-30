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
    var SPEED = 0.05
    var zoom = -12;

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
    const { vertices: body_vertices, indices: body_indices } = generateEllipsoid(1.1, 1.3, 0.8, 30, 30, [1.0, 0.5, 0.0]);
    const body = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, body_vertices, body_indices, GL.TRIANGLES);

    const { vertices: head_vertices, indices: head_indices } = generateEllipsoid(0.8, 1.0, 0.9, 30, 30, [1.0, 0.5, 0.0]);
    const head = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, head_vertices, head_indices, GL.TRIANGLES);

    const { vertices: cheek_vertices, indices: cheek_indices } = generateEllipsoid(0.87, 0.8, 0.8, 30, 30, [1.0, 0.5, 0.0]);
    const cheeks = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, cheek_vertices, cheek_indices, GL.TRIANGLES);

    const { vertices: mouth_base_vertices, indices: mouth_base_indices } = generateEllipsoid(0.7, 0.8, 0.85, 30, 30, [1.0, 0.5, 0.0]);
    const mouthBase = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, mouth_base_vertices, mouth_base_indices, GL.TRIANGLES);

    const { vertices: mouth_vertices, indices: mouth_indices } = generateEllipsoid(0.45, 0.2, 0.12, 20, 20, [1.0, 0.6, 0.6]);
    const mouth = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, mouth_vertices, mouth_indices, GL.TRIANGLES);

    const { vertices: nose_vertices, indices: nose_indices } = generateEllipsoid(0.04, 0.04, 0.04, 20, 20, [0.0, 0.0, 0.0]);
    const noseLeft = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, nose_vertices, nose_indices, GL.TRIANGLES);
    const noseRight = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, nose_vertices, nose_indices, GL.TRIANGLES);

    const { vertices: eyebrow_vertices, indices: eyebrow_indices } = generateBlanket(0.07, 0.15, 0.1, 30, 30, [0.0, 0.0, 0.0], 0.05);
    const leftEyebrow = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyebrow_vertices, eyebrow_indices, GL.TRIANGLES);
    const rightEyebrow = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyebrow_vertices, eyebrow_indices, GL.TRIANGLES);

    const { vertices: eyeWhite_vertices, indices: eyeWhite_indices } = generateEllipsoid(0.23, 0.3, 0.1, 20, 20, [0.0, 0.0, 0.0]);
    const leftEye = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyeWhite_vertices, eyeWhite_indices, GL.TRIANGLES);
    const rightEye = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyeWhite_vertices, eyeWhite_indices, GL.TRIANGLES);

    const { vertices: eyePupil_vertices, indices: eyePupil_indices } = generateEllipsoid(0.09, 0.14, 0.06, 20, 20, [1.0, 1.0, 1.0]);
    const leftEyePupil = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyePupil_vertices, eyePupil_indices, GL.TRIANGLES);
    const rightEyePupil = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyePupil_vertices, eyePupil_indices, GL.TRIANGLES);

    const { vertices: eyePupil2_vertices, indices: eyePupil2_indices } = generateEllipsoid(0.09, 0.08, 0.06, 20, 20, [1.0, 1.0, 1.0]);
    const leftEyePupil2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyePupil2_vertices, eyePupil2_indices, GL.TRIANGLES);
    const rightEyePupil2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyePupil2_vertices, eyePupil2_indices, GL.TRIANGLES);

    const { vertices: tail_vertices, indices: tail_indices } = generateCurvedCylinder(0.4, 0.2, 1.5, 20, 10, [1.0, 0.5, 0.0]);
    const tail = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tail_vertices, tail_indices, GL.TRIANGLES);

    const { vertices: tail_tip, indices: tail_tip_indices } = generateEllipsoidGradient(0.3, 0.3, 0.3, 30, 30, [1.0, 0.5, 0.0], [1.0, 1.0, 0.0]);
    const tailTip = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tail_tip, tail_tip_indices, GL.TRIANGLES);

    const { vertices: fire_vertices, indices: fire_indices } = generateCylinderDynamicRadius(0.2, 0.5, 0.0, 0.0, 1.1, 32, 32, [1.0, 0.3, 0.0], "sin");
    const tailTipFire = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, fire_vertices, fire_indices, GL.TRIANGLES);

    const { vertices: belly_vertices, indices: belly_indices } = generateEllipsoid(0.9, 1.05, 0.4, 30, 30, [1.0, 1.0, 0.6]);
    const belly = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, belly_vertices, belly_indices, GL.TRIANGLES);

    const { vertices: shoulder_vertices, indices: shoulder_indices } = generateEllipsoid(0.3, 0.3, 0.3, 30, 30, [1.0, 0.5, 0.0]);
    const leftarmShoulder = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, shoulder_vertices, shoulder_indices, GL.TRIANGLES);
    const rightarmShoulder = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, shoulder_vertices, shoulder_indices, GL.TRIANGLES);

    const { vertices: arm_vertices, indices: arm_indices } = generateEllipsoid(0.6, 0.3, 0.3, 30, 30, [1.0, 0.5, 0.0]);
    const leftArm = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, arm_vertices, arm_indices, GL.TRIANGLES);
    const rightArm = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, arm_vertices, arm_indices, GL.TRIANGLES);

    const { vertices: finger_vertices, indices: finger_indices } = generateEllipticParaboloid(0.1, 0.1, 0.3, 20, 10, [1.0, 0.5, 0.0]);
    const leftFinger1 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices, GL.TRIANGLES);
    const leftFinger2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices, GL.TRIANGLES);
    const leftFinger3 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices, GL.TRIANGLES);
    const leftFinger4 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices, GL.TRIANGLES);
    const rightFinger1 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices, GL.TRIANGLES);
    const rightFinger2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices, GL.TRIANGLES);
    const rightFinger3 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices, GL.TRIANGLES);
    const rightFinger4 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices, GL.TRIANGLES);

    const { vertices: leg_vertices, indices: leg_indices } = generateEllipsoid(0.4, 0.8, 0.4, 30, 30, [1.0, 0.5, 0.0]);
    const leftLeg = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leg_vertices, leg_indices, GL.TRIANGLES);
    const rightLeg = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leg_vertices, leg_indices, GL.TRIANGLES);

    const { vertices: leg_ankle_vertices, indices: leg_ankle_indices } = generateEllipsoid(0.3, 0.3, 0.3, 30, 30, [1.0, 0.5, 0.0]);
    const leftLegAnkle = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leg_ankle_vertices, leg_ankle_indices, GL.TRIANGLES);
    const rightLegAnkle = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leg_ankle_vertices, leg_ankle_indices, GL.TRIANGLES);

    const { vertices: leg_foot_vertices, indices: leg_foot_indices } = generateEllipsoid(0.35, 0.2, 0.5, 30, 30, [1.0, 0.5, 0.0]);
    const leftLegFoot = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leg_foot_vertices, leg_foot_indices, GL.TRIANGLES);
    const rightLegFoot = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leg_foot_vertices, leg_foot_indices, GL.TRIANGLES);

    const { vertices: claw_vertices, indices: claw_indices } = generateEllipticParaboloid(0.1, 0.1, 0.3, 20, 10, [1.0, 1.0, 1.0]);
    const leftLegClaw1 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, claw_vertices, claw_indices, GL.TRIANGLES);
    const leftLegClaw2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, claw_vertices, claw_indices, GL.TRIANGLES);
    const leftLegClaw3 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, claw_vertices, claw_indices, GL.TRIANGLES);
    const rightLegClaw1 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, claw_vertices, claw_indices, GL.TRIANGLES);
    const rightLegClaw2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, claw_vertices, claw_indices, GL.TRIANGLES);
    const rightLegClaw3 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, claw_vertices, claw_indices, GL.TRIANGLES);
    // ========== GENERATE SHAPE OBJECT END ==========

    // ========== ROTATE SCALE TRANSLATE START ==========
    LIBS.translateY(head.MOVE_MATRIX, 1.6);
    LIBS.translateZ(head.MOVE_MATRIX, 0.1);

    LIBS.translateX(leftEyebrow.MOVE_MATRIX, 0.6);
    LIBS.translateY(leftEyebrow.MOVE_MATRIX, 1.92);
    LIBS.translateZ(leftEyebrow.MOVE_MATRIX, -0.6);
    LIBS.rotateX(leftEyebrow.MOVE_MATRIX, LIBS.degToRad(45));
    LIBS.rotateZ(leftEyebrow.MOVE_MATRIX, LIBS.degToRad(75));

    LIBS.translateX(rightEyebrow.MOVE_MATRIX, -0.7);
    LIBS.translateY(rightEyebrow.MOVE_MATRIX, 1.79);
    LIBS.translateZ(rightEyebrow.MOVE_MATRIX, -0.45);
    LIBS.rotateX(rightEyebrow.MOVE_MATRIX, LIBS.degToRad(-225));
    LIBS.rotateZ(rightEyebrow.MOVE_MATRIX, LIBS.degToRad(-250));

    LIBS.translateX(leftEye.MOVE_MATRIX, -0.45);
    LIBS.translateY(leftEye.MOVE_MATRIX, 0.3);
    LIBS.translateZ(leftEye.MOVE_MATRIX, 0.6);
    LIBS.rotateY(leftEye.MOVE_MATRIX, LIBS.degToRad(-50));

    LIBS.translateX(leftEyePupil.MOVE_MATRIX, 0.02);
    LIBS.translateY(leftEyePupil.MOVE_MATRIX, 0.07);
    LIBS.translateZ(leftEyePupil.MOVE_MATRIX, 0.09);

    LIBS.translateX(rightEye.MOVE_MATRIX, 0.45);
    LIBS.translateY(rightEye.MOVE_MATRIX, 0.3);
    LIBS.translateZ(rightEye.MOVE_MATRIX, 0.6);
    LIBS.rotateY(rightEye.MOVE_MATRIX, LIBS.degToRad(50));

    LIBS.translateX(rightEyePupil.MOVE_MATRIX, -0.02);
    LIBS.translateY(rightEyePupil.MOVE_MATRIX, 0.07);
    LIBS.translateZ(rightEyePupil.MOVE_MATRIX, 0.09);

    LIBS.translateZ(mouthBase.MOVE_MATRIX, 0.2);

    LIBS.translateY(mouth.MOVE_MATRIX, -0.1);
    LIBS.translateZ(mouth.MOVE_MATRIX, 0.04);
    LIBS.rotateX(mouth.MOVE_MATRIX, LIBS.degToRad(30));

    LIBS.translateX(noseLeft.MOVE_MATRIX, 0.1);
    LIBS.translateY(noseLeft.MOVE_MATRIX, -0.1);
    LIBS.translateZ(noseLeft.MOVE_MATRIX, 0.8);

    LIBS.translateX(noseRight.MOVE_MATRIX, -0.1);
    LIBS.translateY(noseRight.MOVE_MATRIX, -0.1);
    LIBS.translateZ(noseRight.MOVE_MATRIX, 0.8);

    LIBS.translateY(tail.MOVE_MATRIX, 0.6);
    LIBS.translateZ(tail.MOVE_MATRIX, -0.8);
    LIBS.rotateX(tail.MOVE_MATRIX, -Math.PI / 3);
    LIBS.rotateY(tail.MOVE_MATRIX, Math.PI);

    LIBS.translateY(tailTip.MOVE_MATRIX, 0.6);
    LIBS.translateZ(tailTip.MOVE_MATRIX, -1.39);
    LIBS.rotateX(tailTip.MOVE_MATRIX, LIBS.degToRad(-90));

    LIBS.translateY(tailTipFire.MOVE_MATRIX, 0.56);
    LIBS.translateZ(tailTipFire.MOVE_MATRIX, -1.07);
    LIBS.rotateX(tailTipFire.MOVE_MATRIX, LIBS.degToRad(-60));

    LIBS.translateY(belly.MOVE_MATRIX, -0.2);
    LIBS.translateZ(belly.MOVE_MATRIX, 0.41);
    LIBS.rotateX(belly.MOVE_MATRIX, Math.PI / 16);

    LIBS.translateX(leftarmShoulder.MOVE_MATRIX, 0.8);
    LIBS.translateY(leftarmShoulder.MOVE_MATRIX, 0.6);

    LIBS.translateX(leftArm.MOVE_MATRIX, 0.3);
    LIBS.translateY(leftArm.MOVE_MATRIX, 0.37);
    LIBS.translateZ(leftArm.MOVE_MATRIX, -0.3);
    LIBS.rotateY(leftArm.MOVE_MATRIX, LIBS.degToRad(-30));
    LIBS.rotateZ(leftArm.MOVE_MATRIX, LIBS.degToRad(-30));

    LIBS.translateX(leftFinger1.MOVE_MATRIX, 2.1);
    LIBS.translateY(leftFinger1.MOVE_MATRIX, -0.7);
    LIBS.translateZ(leftFinger1.MOVE_MATRIX, 0.1);
    LIBS.rotateY(leftFinger1.MOVE_MATRIX, LIBS.degToRad(-150));
    LIBS.rotateZ(leftFinger1.MOVE_MATRIX, LIBS.degToRad(-30));

    LIBS.translateX(leftFinger2.MOVE_MATRIX, 1.62);
    LIBS.translateY(leftFinger2.MOVE_MATRIX, -0.41);
    LIBS.translateZ(leftFinger2.MOVE_MATRIX, -0.64);
    LIBS.rotateY(leftFinger2.MOVE_MATRIX, LIBS.degToRad(-100));
    LIBS.rotateZ(leftFinger2.MOVE_MATRIX, LIBS.degToRad(-30));

    LIBS.translateX(leftFinger3.MOVE_MATRIX, 1.55);
    LIBS.translateY(leftFinger3.MOVE_MATRIX, -0.35);
    LIBS.translateZ(leftFinger3.MOVE_MATRIX, -0.78);
    LIBS.rotateY(leftFinger3.MOVE_MATRIX, LIBS.degToRad(-90));
    LIBS.rotateZ(leftFinger3.MOVE_MATRIX, LIBS.degToRad(-30));

    LIBS.translateX(leftFinger4.MOVE_MATRIX, 1.15);
    LIBS.translateY(leftFinger4.MOVE_MATRIX, -0.15);
    LIBS.translateZ(leftFinger4.MOVE_MATRIX, -0.95);
    LIBS.rotateY(leftFinger4.MOVE_MATRIX, LIBS.degToRad(-70));
    LIBS.rotateZ(leftFinger4.MOVE_MATRIX, LIBS.degToRad(-30));

    LIBS.translateX(rightFinger1.MOVE_MATRIX, -2.1 - 0.14);
    LIBS.translateY(rightFinger1.MOVE_MATRIX, -0.7);
    LIBS.translateZ(rightFinger1.MOVE_MATRIX, 0.1 + 0.02);
    LIBS.rotateY(rightFinger1.MOVE_MATRIX, LIBS.degToRad(150));
    LIBS.rotateZ(rightFinger1.MOVE_MATRIX, LIBS.degToRad(30));

    LIBS.translateX(rightFinger2.MOVE_MATRIX, -1.62 - 0.14);
    LIBS.translateY(rightFinger2.MOVE_MATRIX, -0.41);
    LIBS.translateZ(rightFinger2.MOVE_MATRIX, -0.65 + 0.02);
    LIBS.rotateY(rightFinger2.MOVE_MATRIX, LIBS.degToRad(100));
    LIBS.rotateZ(rightFinger2.MOVE_MATRIX, LIBS.degToRad(30));

    LIBS.translateX(rightFinger3.MOVE_MATRIX, -1.55 - 0.14);
    LIBS.translateY(rightFinger3.MOVE_MATRIX, -0.35);
    LIBS.translateZ(rightFinger3.MOVE_MATRIX, -0.78 + 0.02);
    LIBS.rotateY(rightFinger3.MOVE_MATRIX, LIBS.degToRad(90));
    LIBS.rotateZ(rightFinger3.MOVE_MATRIX, LIBS.degToRad(30));

    LIBS.translateX(rightFinger4.MOVE_MATRIX, -1.17 - 0.14);
    LIBS.translateY(rightFinger4.MOVE_MATRIX, -0.15);
    LIBS.translateZ(rightFinger4.MOVE_MATRIX, -0.95 + 0.02);
    LIBS.rotateY(rightFinger4.MOVE_MATRIX, LIBS.degToRad(70));
    LIBS.rotateZ(rightFinger4.MOVE_MATRIX, LIBS.degToRad(30));

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

    LIBS.translateX(leftLegClaw1.MOVE_MATRIX, 0.15);
    LIBS.translateY(leftLegClaw1.MOVE_MATRIX, -2.85);
    LIBS.translateZ(leftLegClaw1.MOVE_MATRIX, 1.02);
    LIBS.rotateX(leftLegClaw1.MOVE_MATRIX, LIBS.degToRad(180));
    LIBS.rotateY(leftLegClaw1.MOVE_MATRIX, LIBS.degToRad(20));

    LIBS.translateX(leftLegClaw2.MOVE_MATRIX, 0.30);
    LIBS.translateY(leftLegClaw2.MOVE_MATRIX, -2.85);
    LIBS.translateZ(leftLegClaw2.MOVE_MATRIX, 1.02);
    LIBS.rotateX(leftLegClaw2.MOVE_MATRIX, LIBS.degToRad(180));
    LIBS.rotateY(leftLegClaw2.MOVE_MATRIX, LIBS.degToRad(20));

    LIBS.translateX(leftLegClaw3.MOVE_MATRIX, 0.42);
    LIBS.translateY(leftLegClaw3.MOVE_MATRIX, -2.85);
    LIBS.translateZ(leftLegClaw3.MOVE_MATRIX, 0.92);
    LIBS.rotateX(leftLegClaw3.MOVE_MATRIX, LIBS.degToRad(180));
    LIBS.rotateY(leftLegClaw3.MOVE_MATRIX, LIBS.degToRad(20));

    LIBS.translateX(rightLegClaw1.MOVE_MATRIX, -0.15);
    LIBS.translateY(rightLegClaw1.MOVE_MATRIX, -2.85);
    LIBS.translateZ(rightLegClaw1.MOVE_MATRIX, 1.02);
    LIBS.rotateX(rightLegClaw1.MOVE_MATRIX, LIBS.degToRad(180));
    LIBS.rotateY(rightLegClaw1.MOVE_MATRIX, LIBS.degToRad(-20));

    LIBS.translateX(rightLegClaw2.MOVE_MATRIX, -0.30);
    LIBS.translateY(rightLegClaw2.MOVE_MATRIX, -2.85);
    LIBS.translateZ(rightLegClaw2.MOVE_MATRIX, 1.02);
    LIBS.rotateX(rightLegClaw2.MOVE_MATRIX, LIBS.degToRad(180));
    LIBS.rotateY(rightLegClaw2.MOVE_MATRIX, LIBS.degToRad(-20));

    LIBS.translateX(rightLegClaw3.MOVE_MATRIX, -0.42);
    LIBS.translateY(rightLegClaw3.MOVE_MATRIX, -2.85);
    LIBS.translateZ(rightLegClaw3.MOVE_MATRIX, 0.92);
    LIBS.rotateX(rightLegClaw3.MOVE_MATRIX, LIBS.degToRad(180));
    LIBS.rotateY(rightLegClaw3.MOVE_MATRIX, LIBS.degToRad(-20));
    // ========== ROTATE SCALE TRANSLATE END ==========

    // ========== CHILDS PUSH START ==========
    body.addChild(head);
    body.addChild(tail);
    body.addChild(belly);
    body.addChild(leftarmShoulder);
    body.addChild(rightarmShoulder);
    body.addChild(leftLeg);
    body.addChild(rightLeg);
    head.addChild(leftEye);
    head.addChild(rightEye);
    head.addChild(leftEyebrow);
    head.addChild(rightEyebrow);
    head.addChild(cheeks);
    head.addChild(mouthBase);
    head.addChild(mouth);
    mouthBase.addChild(noseLeft);
    mouthBase.addChild(noseRight);
    tail.addChild(tailTip);
    tail.addChild(tailTipFire);
    leftEye.addChild(leftEyePupil);
    rightEye.addChild(rightEyePupil);
    leftEye.addChild(leftEyePupil2);
    rightEye.addChild(rightEyePupil2);
    leftarmShoulder.addChild(leftArm);
    rightarmShoulder.addChild(rightArm);
    leftArm.addChild(leftFinger1);
    leftArm.addChild(leftFinger2);
    leftArm.addChild(leftFinger3);
    leftArm.addChild(leftFinger4);
    rightArm.addChild(rightFinger1);
    rightArm.addChild(rightFinger2);
    rightArm.addChild(rightFinger3);
    rightArm.addChild(rightFinger4);
    leftLeg.addChild(leftLegAnkle);
    rightLeg.addChild(rightLegAnkle);
    leftLegAnkle.addChild(leftLegFoot);
    rightLegAnkle.addChild(rightLegFoot);
    leftLegAnkle.addChild(leftLegClaw1);
    leftLegAnkle.addChild(leftLegClaw2);
    leftLegAnkle.addChild(leftLegClaw3);
    rightLegAnkle.addChild(rightLegClaw1);
    rightLegAnkle.addChild(rightLegClaw2);
    rightLegAnkle.addChild(rightLegClaw3);
    // ========== CHIILDS PUSH END ==========

    // ========== SETUP START ==========
    body.setup();
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

        // ========== RENDER PARENT OBJECT START ==========
        body.render(MODELMATRIX);
        // ========== RENDER PARENT OBJECT END ==========

        GL.flush();
        window.requestAnimationFrame(animate);
    }

    animate(0);
}

window.addEventListener('load', main);