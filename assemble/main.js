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
    var zoom = -20;

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
    const { vertices: base_vertices, indices: base_indices } = generateCircleDisk(24.0, 0.6, 64, [0.1, 0.6, 0.1], [0.4, 0.25, 0.1]);
    const base = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, base_vertices, base_indices, GL.TRIANGLES);

    const { vertices: body_vertices, indices: body_indices } = generateEllipsoid(1.1, 1.3, 0.8, 30, 30, [1.0, 0.5, 0.0]);
    const charmanderBody = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, body_vertices, body_indices, GL.TRIANGLES);

    const { vertices: head_vertices, indices: head_indices } = generateEllipsoid(0.8, 1.0, 0.9, 30, 30, [1.0, 0.5, 0.0]);
    const charmanderHead = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, head_vertices, head_indices, GL.TRIANGLES);

    const { vertices: cheek_vertices, indices: cheek_indices } = generateEllipsoid(0.87, 0.8, 0.8, 30, 30, [1.0, 0.5, 0.0]);
    const charmanderCheeks = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, cheek_vertices, cheek_indices, GL.TRIANGLES);

    const { vertices: mouth_base_vertices, indices: mouth_base_indices } = generateEllipsoid(0.7, 0.8, 0.85, 30, 30, [1.0, 0.5, 0.0]);
    const charmanderMouthBase = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, mouth_base_vertices, mouth_base_indices, GL.TRIANGLES);

    const { vertices: mouth_vertices, indices: mouth_indices } = generateEllipsoid(0.45, 0.2, 0.12, 20, 20, [1.0, 0.6, 0.6]);
    const charmanderMouth = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, mouth_vertices, mouth_indices, GL.TRIANGLES);

    const { vertices: nose_vertices, indices: nose_indices } = generateEllipsoid(0.04, 0.04, 0.04, 20, 20, [0.0, 0.0, 0.0]);
    const charmanderNoseLeft = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, nose_vertices, nose_indices, GL.TRIANGLES);
    const charmaderNoseRight = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, nose_vertices, nose_indices, GL.TRIANGLES);

    const { vertices: eyebrow_vertices, indices: eyebrow_indices } = generateBlanket(0.07, 0.15, 0.1, 30, 30, [0.0, 0.0, 0.0], 0.05);
    const charmanderLeftEyebrow = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyebrow_vertices, eyebrow_indices, GL.TRIANGLES);
    const charmanderRightEyebrow = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyebrow_vertices, eyebrow_indices, GL.TRIANGLES);

    const { vertices: eyeWhite_vertices, indices: eyeWhite_indices } = generateEllipsoid(0.23, 0.3, 0.1, 20, 20, [0.0, 0.0, 0.0]);
    const charmanderLeftEye = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyeWhite_vertices, eyeWhite_indices, GL.TRIANGLES);
    const charmanderRightEye = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyeWhite_vertices, eyeWhite_indices, GL.TRIANGLES);

    const { vertices: eyePupil_vertices, indices: eyePupil_indices } = generateEllipsoid(0.09, 0.14, 0.06, 20, 20, [1.0, 1.0, 1.0]);
    const charmanderLeftEyePupil = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyePupil_vertices, eyePupil_indices, GL.TRIANGLES);
    const charmanderRightEyePupil = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyePupil_vertices, eyePupil_indices, GL.TRIANGLES);

    const { vertices: eyePupil2_vertices, indices: eyePupil2_indices } = generateEllipsoid(0.09, 0.08, 0.06, 20, 20, [1.0, 1.0, 1.0]);
    const charmanderLeftEyePupil2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyePupil2_vertices, eyePupil2_indices, GL.TRIANGLES);
    const charmanderRightEyePupil2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyePupil2_vertices, eyePupil2_indices, GL.TRIANGLES);

    const { vertices: tail_vertices, indices: tail_indices } = generateCurvedCylinder(0.4, 0.2, 1.5, 20, 10, [1.0, 0.5, 0.0]);
    const charmanderTail = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tail_vertices, tail_indices, GL.TRIANGLES);

    const { vertices: tail_tip, indices: tail_tip_indices } = generateEllipsoidGradient(0.3, 0.3, 0.3, 30, 30, [1.0, 0.5, 0.0], [1.0, 1.0, 0.0]);
    const charmanderTailTip = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tail_tip, tail_tip_indices, GL.TRIANGLES);

    const { vertices: fire_vertices, indices: fire_indices } = generateCylinderDynamicRadius(0.2, 0.5, 0.0, 0.0, 1.1, 32, 32, [1.0, 0.3, 0.0], "sin");
    const charmanderTailTipFire = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, fire_vertices, fire_indices, GL.TRIANGLES);

    const { vertices: belly_vertices, indices: belly_indices } = generateEllipsoid(0.9, 1.05, 0.4, 30, 30, [1.0, 1.0, 0.6]);
    const charmanderBelly = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, belly_vertices, belly_indices, GL.TRIANGLES);

    const { vertices: shoulder_vertices, indices: shoulder_indices } = generateEllipsoid(0.3, 0.3, 0.3, 30, 30, [1.0, 0.5, 0.0]);
    const charmanderLeftarmShoulder = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, shoulder_vertices, shoulder_indices, GL.TRIANGLES);
    const charmanderRightarmShoulder = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, shoulder_vertices, shoulder_indices, GL.TRIANGLES);

    const { vertices: arm_vertices, indices: arm_indices } = generateEllipsoid(0.6, 0.3, 0.3, 30, 30, [1.0, 0.5, 0.0]);
    const charmanderLeftArm = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, arm_vertices, arm_indices, GL.TRIANGLES);
    const charmanderRightArm = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, arm_vertices, arm_indices, GL.TRIANGLES);

    const { vertices: finger_vertices, indices: finger_indices } = generateEllipticParaboloid(0.1, 0.1, 0.3, 20, 10, [1.0, 0.5, 0.0]);
    const charmanderLeftFinger1 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices, GL.TRIANGLES);
    const charmanderLeftFinger2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices, GL.TRIANGLES);
    const charmanderLeftFinger3 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices, GL.TRIANGLES);
    const charmanderLeftFinger4 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices, GL.TRIANGLES);
    const charmanderRightFinger1 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices, GL.TRIANGLES);
    const charmanderRightFinger2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices, GL.TRIANGLES);
    const charmanderRightFinger3 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices, GL.TRIANGLES);
    const charmanderRightFinger4 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices, GL.TRIANGLES);

    const { vertices: leg_vertices, indices: leg_indices } = generateEllipsoid(0.4, 0.8, 0.4, 30, 30, [1.0, 0.5, 0.0]);
    const charmanderLeftLeg = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leg_vertices, leg_indices, GL.TRIANGLES);
    const charmanderRightLeg = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leg_vertices, leg_indices, GL.TRIANGLES);

    const { vertices: leg_ankle_vertices, indices: leg_ankle_indices } = generateEllipsoid(0.3, 0.3, 0.3, 30, 30, [1.0, 0.5, 0.0]);
    const charmanderLeftLegAnkle = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leg_ankle_vertices, leg_ankle_indices, GL.TRIANGLES);
    const charmanderRightLegAnkle = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leg_ankle_vertices, leg_ankle_indices, GL.TRIANGLES);

    const { vertices: leg_foot_vertices, indices: leg_foot_indices } = generateEllipsoid(0.35, 0.2, 0.5, 30, 30, [1.0, 0.5, 0.0]);
    const charmanderLeftLegFoot = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leg_foot_vertices, leg_foot_indices, GL.TRIANGLES);
    const charmanderRightLegFoot = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leg_foot_vertices, leg_foot_indices, GL.TRIANGLES);

    const { vertices: claw_vertices, indices: claw_indices } = generateEllipticParaboloid(0.1, 0.1, 0.3, 20, 10, [1.0, 1.0, 1.0]);
    const charmanderLeftLegClaw1 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, claw_vertices, claw_indices, GL.TRIANGLES);
    const charmanderLeftLegClaw2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, claw_vertices, claw_indices, GL.TRIANGLES);
    const charmanderLeftLegClaw3 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, claw_vertices, claw_indices, GL.TRIANGLES);
    const charmanderRightLegClaw1 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, claw_vertices, claw_indices, GL.TRIANGLES);
    const charmanderRightLegClaw2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, claw_vertices, claw_indices, GL.TRIANGLES);
    const charmanderRightLegClaw3 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, claw_vertices, claw_indices, GL.TRIANGLES);
    // ========== GENERATE SHAPE OBJECT END ==========

    // ========== ROTATE SCALE TRANSLATE START ==========
    LIBS.translateY(base.MOVE_MATRIX, -2.0);
    LIBS.rotateX(base.MOVE_MATRIX, -Math.PI / 2);

    LIBS.translateY(charmanderHead.MOVE_MATRIX, 1.6);
    LIBS.translateZ(charmanderHead.MOVE_MATRIX, 0.1);

    LIBS.translateX(charmanderLeftEyebrow.MOVE_MATRIX, 0.6);
    LIBS.translateY(charmanderLeftEyebrow.MOVE_MATRIX, 1.92);
    LIBS.translateZ(charmanderLeftEyebrow.MOVE_MATRIX, -0.6);
    LIBS.rotateX(charmanderLeftEyebrow.MOVE_MATRIX, LIBS.degToRad(45));
    LIBS.rotateZ(charmanderLeftEyebrow.MOVE_MATRIX, LIBS.degToRad(75));

    LIBS.translateX(charmanderRightEyebrow.MOVE_MATRIX, -0.7);
    LIBS.translateY(charmanderRightEyebrow.MOVE_MATRIX, 1.79);
    LIBS.translateZ(charmanderRightEyebrow.MOVE_MATRIX, -0.45);
    LIBS.rotateX(charmanderRightEyebrow.MOVE_MATRIX, LIBS.degToRad(-225));
    LIBS.rotateZ(charmanderRightEyebrow.MOVE_MATRIX, LIBS.degToRad(-250));

    LIBS.translateX(charmanderLeftEye.MOVE_MATRIX, -0.45);
    LIBS.translateY(charmanderLeftEye.MOVE_MATRIX, 0.3);
    LIBS.translateZ(charmanderLeftEye.MOVE_MATRIX, 0.6);
    LIBS.rotateY(charmanderLeftEye.MOVE_MATRIX, LIBS.degToRad(-50));

    LIBS.translateX(charmanderLeftEyePupil.MOVE_MATRIX, 0.02);
    LIBS.translateY(charmanderLeftEyePupil.MOVE_MATRIX, 0.07);
    LIBS.translateZ(charmanderLeftEyePupil.MOVE_MATRIX, 0.09);

    LIBS.translateX(charmanderRightEye.MOVE_MATRIX, 0.45);
    LIBS.translateY(charmanderRightEye.MOVE_MATRIX, 0.3);
    LIBS.translateZ(charmanderRightEye.MOVE_MATRIX, 0.6);
    LIBS.rotateY(charmanderRightEye.MOVE_MATRIX, LIBS.degToRad(50));

    LIBS.translateX(charmanderRightEyePupil.MOVE_MATRIX, -0.02);
    LIBS.translateY(charmanderRightEyePupil.MOVE_MATRIX, 0.07);
    LIBS.translateZ(charmanderRightEyePupil.MOVE_MATRIX, 0.09);

    LIBS.translateZ(charmanderMouthBase.MOVE_MATRIX, 0.2);

    LIBS.translateY(charmanderMouth.MOVE_MATRIX, -0.1);
    LIBS.translateZ(charmanderMouth.MOVE_MATRIX, 0.04);
    LIBS.rotateX(charmanderMouth.MOVE_MATRIX, LIBS.degToRad(30));

    LIBS.translateX(charmanderNoseLeft.MOVE_MATRIX, 0.1);
    LIBS.translateY(charmanderNoseLeft.MOVE_MATRIX, -0.1);
    LIBS.translateZ(charmanderNoseLeft.MOVE_MATRIX, 0.8);

    LIBS.translateX(charmaderNoseRight.MOVE_MATRIX, -0.1);
    LIBS.translateY(charmaderNoseRight.MOVE_MATRIX, -0.1);
    LIBS.translateZ(charmaderNoseRight.MOVE_MATRIX, 0.8);

    LIBS.translateY(charmanderTail.MOVE_MATRIX, 0.6);
    LIBS.translateZ(charmanderTail.MOVE_MATRIX, -0.8);
    LIBS.rotateX(charmanderTail.MOVE_MATRIX, -Math.PI / 3);
    LIBS.rotateY(charmanderTail.MOVE_MATRIX, Math.PI);

    LIBS.translateY(charmanderTailTip.MOVE_MATRIX, 0.6);
    LIBS.translateZ(charmanderTailTip.MOVE_MATRIX, -1.39);
    LIBS.rotateX(charmanderTailTip.MOVE_MATRIX, LIBS.degToRad(-90));

    LIBS.translateY(charmanderTailTipFire.MOVE_MATRIX, 0.56);
    LIBS.translateZ(charmanderTailTipFire.MOVE_MATRIX, -1.07);
    LIBS.rotateX(charmanderTailTipFire.MOVE_MATRIX, LIBS.degToRad(-60));

    LIBS.translateY(charmanderBelly.MOVE_MATRIX, -0.2);
    LIBS.translateZ(charmanderBelly.MOVE_MATRIX, 0.41);
    LIBS.rotateX(charmanderBelly.MOVE_MATRIX, Math.PI / 16);

    LIBS.translateX(charmanderLeftarmShoulder.MOVE_MATRIX, 0.8);
    LIBS.translateY(charmanderLeftarmShoulder.MOVE_MATRIX, 0.6);

    LIBS.translateX(charmanderLeftArm.MOVE_MATRIX, 0.3);
    LIBS.translateY(charmanderLeftArm.MOVE_MATRIX, 0.37);
    LIBS.translateZ(charmanderLeftArm.MOVE_MATRIX, -0.3);
    LIBS.rotateY(charmanderLeftArm.MOVE_MATRIX, LIBS.degToRad(-30));
    LIBS.rotateZ(charmanderLeftArm.MOVE_MATRIX, LIBS.degToRad(-30));

    LIBS.translateX(charmanderLeftFinger1.MOVE_MATRIX, 2.1);
    LIBS.translateY(charmanderLeftFinger1.MOVE_MATRIX, -0.7);
    LIBS.translateZ(charmanderLeftFinger1.MOVE_MATRIX, 0.1);
    LIBS.rotateY(charmanderLeftFinger1.MOVE_MATRIX, LIBS.degToRad(-150));
    LIBS.rotateZ(charmanderLeftFinger1.MOVE_MATRIX, LIBS.degToRad(-30));

    LIBS.translateX(charmanderLeftFinger2.MOVE_MATRIX, 1.62);
    LIBS.translateY(charmanderLeftFinger2.MOVE_MATRIX, -0.41);
    LIBS.translateZ(charmanderLeftFinger2.MOVE_MATRIX, -0.64);
    LIBS.rotateY(charmanderLeftFinger2.MOVE_MATRIX, LIBS.degToRad(-100));
    LIBS.rotateZ(charmanderLeftFinger2.MOVE_MATRIX, LIBS.degToRad(-30));

    LIBS.translateX(charmanderLeftFinger3.MOVE_MATRIX, 1.55);
    LIBS.translateY(charmanderLeftFinger3.MOVE_MATRIX, -0.35);
    LIBS.translateZ(charmanderLeftFinger3.MOVE_MATRIX, -0.78);
    LIBS.rotateY(charmanderLeftFinger3.MOVE_MATRIX, LIBS.degToRad(-90));
    LIBS.rotateZ(charmanderLeftFinger3.MOVE_MATRIX, LIBS.degToRad(-30));

    LIBS.translateX(charmanderLeftFinger4.MOVE_MATRIX, 1.15);
    LIBS.translateY(charmanderLeftFinger4.MOVE_MATRIX, -0.15);
    LIBS.translateZ(charmanderLeftFinger4.MOVE_MATRIX, -0.95);
    LIBS.rotateY(charmanderLeftFinger4.MOVE_MATRIX, LIBS.degToRad(-70));
    LIBS.rotateZ(charmanderLeftFinger4.MOVE_MATRIX, LIBS.degToRad(-30));

    LIBS.translateX(charmanderRightFinger1.MOVE_MATRIX, -2.1 - 0.14);
    LIBS.translateY(charmanderRightFinger1.MOVE_MATRIX, -0.7);
    LIBS.translateZ(charmanderRightFinger1.MOVE_MATRIX, 0.1 + 0.02);
    LIBS.rotateY(charmanderRightFinger1.MOVE_MATRIX, LIBS.degToRad(150));
    LIBS.rotateZ(charmanderRightFinger1.MOVE_MATRIX, LIBS.degToRad(30));

    LIBS.translateX(charmanderRightFinger2.MOVE_MATRIX, -1.62 - 0.14);
    LIBS.translateY(charmanderRightFinger2.MOVE_MATRIX, -0.41);
    LIBS.translateZ(charmanderRightFinger2.MOVE_MATRIX, -0.65 + 0.02);
    LIBS.rotateY(charmanderRightFinger2.MOVE_MATRIX, LIBS.degToRad(100));
    LIBS.rotateZ(charmanderRightFinger2.MOVE_MATRIX, LIBS.degToRad(30));

    LIBS.translateX(charmanderRightFinger3.MOVE_MATRIX, -1.55 - 0.14);
    LIBS.translateY(charmanderRightFinger3.MOVE_MATRIX, -0.35);
    LIBS.translateZ(charmanderRightFinger3.MOVE_MATRIX, -0.78 + 0.02);
    LIBS.rotateY(charmanderRightFinger3.MOVE_MATRIX, LIBS.degToRad(90));
    LIBS.rotateZ(charmanderRightFinger3.MOVE_MATRIX, LIBS.degToRad(30));

    LIBS.translateX(charmanderRightFinger4.MOVE_MATRIX, -1.17 - 0.14);
    LIBS.translateY(charmanderRightFinger4.MOVE_MATRIX, -0.15);
    LIBS.translateZ(charmanderRightFinger4.MOVE_MATRIX, -0.95 + 0.02);
    LIBS.rotateY(charmanderRightFinger4.MOVE_MATRIX, LIBS.degToRad(70));
    LIBS.rotateZ(charmanderRightFinger4.MOVE_MATRIX, LIBS.degToRad(30));

    LIBS.translateX(charmanderRightarmShoulder.MOVE_MATRIX, -0.9);
    LIBS.translateY(charmanderRightarmShoulder.MOVE_MATRIX, 0.6);

    LIBS.translateX(charmanderRightArm.MOVE_MATRIX, -0.3);
    LIBS.translateY(charmanderRightArm.MOVE_MATRIX, 0.37);
    LIBS.translateZ(charmanderRightArm.MOVE_MATRIX, -0.3);
    LIBS.rotateY(charmanderRightArm.MOVE_MATRIX, LIBS.degToRad(30));
    LIBS.rotateZ(charmanderRightArm.MOVE_MATRIX, LIBS.degToRad(30));

    LIBS.translateX(charmanderLeftLeg.MOVE_MATRIX, 0.7);
    LIBS.translateY(charmanderLeftLeg.MOVE_MATRIX, -0.8);

    LIBS.translateX(charmanderRightLeg.MOVE_MATRIX, -0.7);
    LIBS.translateY(charmanderRightLeg.MOVE_MATRIX, -0.8);

    LIBS.translateY(charmanderLeftLegAnkle.MOVE_MATRIX, -0.55);

    LIBS.translateY(charmanderRightLegAnkle.MOVE_MATRIX, -0.55);

    LIBS.translateX(charmanderLeftLegFoot.MOVE_MATRIX, 0.1);
    LIBS.translateY(charmanderLeftLegFoot.MOVE_MATRIX, -0.15);
    LIBS.translateZ(charmanderLeftLegFoot.MOVE_MATRIX, 0.45);
    LIBS.rotateY(charmanderLeftLegFoot.MOVE_MATRIX, LIBS.degToRad(20));

    LIBS.translateX(charmanderRightLegFoot.MOVE_MATRIX, -0.1);
    LIBS.translateY(charmanderRightLegFoot.MOVE_MATRIX, -0.15);
    LIBS.translateZ(charmanderRightLegFoot.MOVE_MATRIX, 0.45);
    LIBS.rotateY(charmanderRightLegFoot.MOVE_MATRIX, LIBS.degToRad(-20));

    LIBS.translateX(charmanderLeftLegClaw1.MOVE_MATRIX, 0.15);
    LIBS.translateY(charmanderLeftLegClaw1.MOVE_MATRIX, -2.85);
    LIBS.translateZ(charmanderLeftLegClaw1.MOVE_MATRIX, 1.02);
    LIBS.rotateX(charmanderLeftLegClaw1.MOVE_MATRIX, LIBS.degToRad(180));
    LIBS.rotateY(charmanderLeftLegClaw1.MOVE_MATRIX, LIBS.degToRad(20));

    LIBS.translateX(charmanderLeftLegClaw2.MOVE_MATRIX, 0.30);
    LIBS.translateY(charmanderLeftLegClaw2.MOVE_MATRIX, -2.85);
    LIBS.translateZ(charmanderLeftLegClaw2.MOVE_MATRIX, 1.02);
    LIBS.rotateX(charmanderLeftLegClaw2.MOVE_MATRIX, LIBS.degToRad(180));
    LIBS.rotateY(charmanderLeftLegClaw2.MOVE_MATRIX, LIBS.degToRad(20));

    LIBS.translateX(charmanderLeftLegClaw3.MOVE_MATRIX, 0.42);
    LIBS.translateY(charmanderLeftLegClaw3.MOVE_MATRIX, -2.85);
    LIBS.translateZ(charmanderLeftLegClaw3.MOVE_MATRIX, 0.92);
    LIBS.rotateX(charmanderLeftLegClaw3.MOVE_MATRIX, LIBS.degToRad(180));
    LIBS.rotateY(charmanderLeftLegClaw3.MOVE_MATRIX, LIBS.degToRad(20));

    LIBS.translateX(charmanderRightLegClaw1.MOVE_MATRIX, -0.15);
    LIBS.translateY(charmanderRightLegClaw1.MOVE_MATRIX, -2.85);
    LIBS.translateZ(charmanderRightLegClaw1.MOVE_MATRIX, 1.02);
    LIBS.rotateX(charmanderRightLegClaw1.MOVE_MATRIX, LIBS.degToRad(180));
    LIBS.rotateY(charmanderRightLegClaw1.MOVE_MATRIX, LIBS.degToRad(-20));

    LIBS.translateX(charmanderRightLegClaw2.MOVE_MATRIX, -0.30);
    LIBS.translateY(charmanderRightLegClaw2.MOVE_MATRIX, -2.85);
    LIBS.translateZ(charmanderRightLegClaw2.MOVE_MATRIX, 1.02);
    LIBS.rotateX(charmanderRightLegClaw2.MOVE_MATRIX, LIBS.degToRad(180));
    LIBS.rotateY(charmanderRightLegClaw2.MOVE_MATRIX, LIBS.degToRad(-20));

    LIBS.translateX(charmanderRightLegClaw3.MOVE_MATRIX, -0.42);
    LIBS.translateY(charmanderRightLegClaw3.MOVE_MATRIX, -2.85);
    LIBS.translateZ(charmanderRightLegClaw3.MOVE_MATRIX, 0.92);
    LIBS.rotateX(charmanderRightLegClaw3.MOVE_MATRIX, LIBS.degToRad(180));
    LIBS.rotateY(charmanderRightLegClaw3.MOVE_MATRIX, LIBS.degToRad(-20));
    // ========== ROTATE SCALE TRANSLATE END ==========

    // ========== CHILDS PUSH START ==========
    charmanderBody.addChild(charmanderHead);
    charmanderBody.addChild(charmanderTail);
    charmanderBody.addChild(charmanderBelly);
    charmanderBody.addChild(charmanderLeftarmShoulder);
    charmanderBody.addChild(charmanderRightarmShoulder);
    charmanderBody.addChild(charmanderLeftLeg);
    charmanderBody.addChild(charmanderRightLeg);
    charmanderHead.addChild(charmanderLeftEye);
    charmanderHead.addChild(charmanderRightEye);
    charmanderHead.addChild(charmanderLeftEyebrow);
    charmanderHead.addChild(charmanderRightEyebrow);
    charmanderHead.addChild(charmanderCheeks);
    charmanderHead.addChild(charmanderMouthBase);
    charmanderHead.addChild(charmanderMouth);
    charmanderMouthBase.addChild(charmanderNoseLeft);
    charmanderMouthBase.addChild(charmaderNoseRight);
    charmanderTail.addChild(charmanderTailTip);
    charmanderTail.addChild(charmanderTailTipFire);
    charmanderLeftEye.addChild(charmanderLeftEyePupil);
    charmanderRightEye.addChild(charmanderRightEyePupil);
    charmanderLeftEye.addChild(charmanderLeftEyePupil2);
    charmanderRightEye.addChild(charmanderRightEyePupil2);
    charmanderLeftarmShoulder.addChild(charmanderLeftArm);
    charmanderRightarmShoulder.addChild(charmanderRightArm);
    charmanderLeftArm.addChild(charmanderLeftFinger1);
    charmanderLeftArm.addChild(charmanderLeftFinger2);
    charmanderLeftArm.addChild(charmanderLeftFinger3);
    charmanderLeftArm.addChild(charmanderLeftFinger4);
    charmanderRightArm.addChild(charmanderRightFinger1);
    charmanderRightArm.addChild(charmanderRightFinger2);
    charmanderRightArm.addChild(charmanderRightFinger3);
    charmanderRightArm.addChild(charmanderRightFinger4);
    charmanderLeftLeg.addChild(charmanderLeftLegAnkle);
    charmanderRightLeg.addChild(charmanderRightLegAnkle);
    charmanderLeftLegAnkle.addChild(charmanderLeftLegFoot);
    charmanderRightLegAnkle.addChild(charmanderRightLegFoot);
    charmanderLeftLegAnkle.addChild(charmanderLeftLegClaw1);
    charmanderLeftLegAnkle.addChild(charmanderLeftLegClaw2);
    charmanderLeftLegAnkle.addChild(charmanderLeftLegClaw3);
    charmanderRightLegAnkle.addChild(charmanderRightLegClaw1);
    charmanderRightLegAnkle.addChild(charmanderRightLegClaw2);
    charmanderRightLegAnkle.addChild(charmanderRightLegClaw3);
    // ========== CHIILDS PUSH END ==========

    // ========== SETUP START ==========
    base.setup();
    charmanderBody.setup();
    // ========== SETUP END ==========

    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.clearColor(0.5, 0.7, 0.9, 1.0);
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
        base.render(MODELMATRIX);
        charmanderBody.render(MODELMATRIX);
        // ========== RENDER PARENT OBJECT END ==========

        GL.flush();
        window.requestAnimationFrame(animate);
    }

    animate(0);
}

window.addEventListener('load', main);