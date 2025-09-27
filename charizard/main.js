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
    var zoom = -24;

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
    const { vertices: body_vertices, indices: body_indices } = generateEllipsoid(2.1, 2.4, 1.5, 30, 30, [1.0, 0.5, 0.0]);
    const body = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, body_vertices, body_indices);

    const { vertices: belly_vertices, indices: belly_indices } = generateEllipsoid(1.9, 2.1, 1.2, 30, 30, [1.0, 1.0, 0.6]);
    const belly = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, belly_vertices, belly_indices);

    const { vertices: thigh_vertices, indices: thigh_indices } = generateEllipsoid(1.0, 1.0, 1.0, 30, 30, [1.0, 0.5, 0.0]);
    const leftThigh = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, thigh_vertices, thigh_indices);
    const rightThigh = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, thigh_vertices, thigh_indices);

    const { vertices: leg_vertices, indices: leg_indices } = generateEllipsoid(0.9, 1.5, 1.0, 30, 30, [1.0, 0.5, 0.0]);
    const leftLeg = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leg_vertices, leg_indices);
    const rightLeg = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leg_vertices, leg_indices);

    const { vertices: foots_vertices, indices: foots_indices } = generateEllipsoid(0.9, 0.4, 1.3, 30, 30, [1.0, 0.5, 0.0]);
    const leftFoot = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, foots_vertices, foots_indices);
    const rightFoot = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, foots_vertices, foots_indices);

    const { vertices: shoulder_vertices, indices: shoulder_indices } = generateEllipsoid(0.9, 0.6, 0.6, 30, 30, [1.0, 0.5, 0.0]);
    const leftShoulder = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, shoulder_vertices, shoulder_indices);
    const rightShoulder = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, shoulder_vertices, shoulder_indices);

    const { vertices: arm_vertices, indices: arm_indices } = generateCurvedByStrengthCylinder(0.3, 0.3, 2.5, 30, 30, [1.0, 0.5, 0.0], 0.5);
    const leftArm = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, arm_vertices, arm_indices);
    const rightArm = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, arm_vertices, arm_indices);

    const { vertices: hand_palm_vertices, indices: hand_palm_indices } = generateEllipsoid(0.35, 0.35, 0.25, 30, 30, [1.0, 0.5, 0.0]);
    const leftHandPalm = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, hand_palm_vertices, hand_palm_indices);
    const rightHandPalm = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, hand_palm_vertices, hand_palm_indices);

    const { vertices: finger_vertices, indices: finger_indices } = generateEllipticParaboloid(0.1, 0.2, 0.4, 20, 10, [1.0, 0.5, 0.0]);
    const leftFinger1 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices);
    const leftFinger2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices);
    const leftFinger3 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices);
    const rightFinger1 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices);
    const rightFinger2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices);
    const rightFinger3 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, finger_vertices, finger_indices);

    const { vertices: foot_claw_vertices, indices: foot_claw_indices } = generateEagleTalon(0.2, 0.0, 0.6, 1.0, 30, 30, [1.0, 1.0, 1.0]);
    const leftFootClaw1 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, foot_claw_vertices, foot_claw_indices);
    const leftFootClaw2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, foot_claw_vertices, foot_claw_indices);
    const leftFootClaw3 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, foot_claw_vertices, foot_claw_indices);
    const rightFootClaw1 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, foot_claw_vertices, foot_claw_indices);
    const rightFootClaw2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, foot_claw_vertices, foot_claw_indices);
    const rightFootClaw3 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, foot_claw_vertices, foot_claw_indices);

    const { vertices: tail_vertices, indices: tail_indices } = generateCurvedCylinder(0.4, 0.2, 3.5, 20, 10, [1.0, 0.5, 0.0]);
    const tail = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tail_vertices, tail_indices);

    const { vertices: tail_tip, indices: tail_tip_indices } = generateEllipsoidGradient(0.6, 0.6, 0.6, 30, 30, [1.0, 0.5, 0.0], [1.0, 1.0, 0.0]);
    const tailTip = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tail_tip, tail_tip_indices);

    const { vertices: fire_vertices, indices: fire_indices } = generateCylinderDynamicRadius(0.6, 0.8, 0.0, 0.0, 1.1, 32, 32, [1.0, 0.3, 0.0], "sin");
    const tailTipFire = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, fire_vertices, fire_indices);

    const { vertices: neck_vertices, indices: neck_indices } = generateCylinderDynamicRadius(0.9, 0.9, 0.4, 0.4, 4.0, 32, 32, [1.0, 0.5, 0.0], "cos");
    const neck = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, neck_vertices, neck_indices);

    const { vertices: head_vertices, indices: head_indices } = generateEllipsoid(1.1, 0.9, 1.0, 30, 30, [1.0, 0.5, 0.0]);
    const head = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, head_vertices, head_indices);

    const { vertices: upper_mouth_vertices, indices: upper_mouth_indices } = generateEllipticParaboloidFlexible(1.0, 0.5, 2.2, 30, 30, 0.2, [1.0, 0.5, 0.0]);
    const upperMouth = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, upper_mouth_vertices, upper_mouth_indices);

    const { vertices: lower_mouth_vertices, indices: lower_mouth_indices } = generateEllipticParaboloidFlexible(0.85, 0.4, 2.0, 30, 30, 0.2, [1.0, 0.5, 0.0]);
    const lowerMouth = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, lower_mouth_vertices, lower_mouth_indices);

    const { vertices: cheeks_vertices, indices: cheeks_indices } = generateEllipsoid(1.1, 0.65, 0.8, 30, 30, [1.0, 0.5, 0.0]);
    const cheeks = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, cheeks_vertices, cheeks_indices);

    const { vertices: upper_teeth_vertices, indices: upper_teeth_indices } = generateEllipticParaboloid(0.1, 0.1, 0.3, 20, 10, [1.0, 1.0, 1.0]);
    const upperTeethLeft = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, upper_teeth_vertices, upper_teeth_indices);
    const upperTeethRight = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, upper_teeth_vertices, upper_teeth_indices);

    const { vertices: lower_teeth_vertices, indices: lower_teeth_indices } = generateEllipticParaboloid(0.05, 0.05, 0.2, 20, 10, [1.0, 1.0, 1.0]);
    const lowerTeethLeft = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, lower_teeth_vertices, lower_teeth_indices);
    const lowerTeethRight = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, lower_teeth_vertices, lower_teeth_indices);

    const { vertices: tongue_vertices, indices: tongue_indices } = generateEllipticParaboloid(0.7, 0.3, 1.8, 20, 10, [1.0, 0.6, 0.8]);
    const tongue = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tongue_vertices, tongue_indices);

    const { vertices: eyelid_vertices, indices: eyelid_indices } = generateEllipsoid(0.5, 0.4, 1.1, 30, 30, [1.0, 0.5, 0.0]);
    const leftEyelid = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyelid_vertices, eyelid_indices);
    const rightEyelid = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyelid_vertices, eyelid_indices);

    const { vertices: eye_white_vertices, indices: eye_white_indices } = generateEllipsoid(0.5, 0.3, 0.6, 30, 30, [1.0, 1.0, 1.0]);
    const leftEyeWhite = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eye_white_vertices, eye_white_indices);
    const rightEyeWhite = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eye_white_vertices, eye_white_indices);

    const { vertices: eye_black_vertices, indices: eye_black_indices } = generateEllipsoid(0.3, 0.2, 0.5, 30, 30, [0.0, 0.0, 0.0]);
    const leftEyeBlack = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eye_black_vertices, eye_black_indices);
    const rightEyeBlack = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eye_black_vertices, eye_black_indices);
    // ========== GENERATE SHAPE OBJECT END ==========

    // ========== ROTATE SCALE TRANSLATE START ==========
    LIBS.translateY(belly.MOVE_MATRIX, -0.2);
    LIBS.translateZ(belly.MOVE_MATRIX, 0.4);
    LIBS.rotateX(belly.MOVE_MATRIX, LIBS.degToRad(5));

    LIBS.translateX(leftThigh.MOVE_MATRIX, 1.9);
    LIBS.translateY(leftThigh.MOVE_MATRIX, -1.5);

    LIBS.translateX(rightThigh.MOVE_MATRIX, -1.9);
    LIBS.translateY(rightThigh.MOVE_MATRIX, -1.5);

    LIBS.translateX(leftLeg.MOVE_MATRIX, 0.35);
    LIBS.translateY(leftLeg.MOVE_MATRIX, -0.5);
    LIBS.translateZ(leftLeg.MOVE_MATRIX, 0.2);

    LIBS.translateX(rightLeg.MOVE_MATRIX, -0.35);
    LIBS.translateY(rightLeg.MOVE_MATRIX, -0.5);
    LIBS.translateZ(rightLeg.MOVE_MATRIX, 0.2);

    LIBS.translateY(leftFoot.MOVE_MATRIX, -1.2);
    LIBS.translateZ(leftFoot.MOVE_MATRIX, 0.4);

    LIBS.translateY(rightFoot.MOVE_MATRIX, -1.2);
    LIBS.translateZ(rightFoot.MOVE_MATRIX, 0.4);

    LIBS.translateX(leftShoulder.MOVE_MATRIX, 1.4);
    LIBS.translateY(leftShoulder.MOVE_MATRIX, 1.0);
    LIBS.translateZ(leftShoulder.MOVE_MATRIX, 0.2);

    LIBS.translateX(rightShoulder.MOVE_MATRIX, -1.4);
    LIBS.translateY(rightShoulder.MOVE_MATRIX, 1.0);
    LIBS.translateZ(rightShoulder.MOVE_MATRIX, 0.2);

    LIBS.translateX(leftArm.MOVE_MATRIX, 2.7);
    LIBS.translateY(leftArm.MOVE_MATRIX, -1.3);
    LIBS.translateZ(leftArm.MOVE_MATRIX, 1.6);
    LIBS.rotateY(leftArm.MOVE_MATRIX, LIBS.degToRad(-30));
    LIBS.rotateZ(leftArm.MOVE_MATRIX, LIBS.degToRad(90));

    LIBS.translateX(rightArm.MOVE_MATRIX, -2.7);
    LIBS.translateY(rightArm.MOVE_MATRIX, -1.3);
    LIBS.translateZ(rightArm.MOVE_MATRIX, 1.6);
    LIBS.rotateY(rightArm.MOVE_MATRIX, LIBS.degToRad(30));
    LIBS.rotateZ(rightArm.MOVE_MATRIX, LIBS.degToRad(-90));

    LIBS.translateX(leftHandPalm.MOVE_MATRIX, 3.3);
    LIBS.translateY(leftHandPalm.MOVE_MATRIX, 0.8);
    LIBS.translateZ(leftHandPalm.MOVE_MATRIX, -1.9);
    LIBS.rotateY(leftHandPalm.MOVE_MATRIX, LIBS.degToRad(-30));

    LIBS.translateX(rightHandPalm.MOVE_MATRIX, -3.3);
    LIBS.translateY(rightHandPalm.MOVE_MATRIX, 0.8);
    LIBS.translateZ(rightHandPalm.MOVE_MATRIX, -1.9);
    LIBS.rotateY(rightHandPalm.MOVE_MATRIX, LIBS.degToRad(30));

    LIBS.translateX(leftFinger1.MOVE_MATRIX, 0.3);
    LIBS.translateY(leftFinger1.MOVE_MATRIX, 2.2);
    LIBS.translateZ(leftFinger1.MOVE_MATRIX, 0.8);
    LIBS.rotateX(leftFinger1.MOVE_MATRIX, LIBS.degToRad(90));

    LIBS.translateX(leftFinger2.MOVE_MATRIX, 3.5);
    LIBS.translateY(leftFinger2.MOVE_MATRIX, 3.85);
    LIBS.translateZ(leftFinger2.MOVE_MATRIX, 2.7);
    LIBS.rotateX(leftFinger2.MOVE_MATRIX, LIBS.degToRad(100));
    LIBS.rotateY(leftFinger2.MOVE_MATRIX, LIBS.degToRad(30));
    LIBS.rotateZ(leftFinger2.MOVE_MATRIX, LIBS.degToRad(-60));

    LIBS.translateX(leftFinger3.MOVE_MATRIX, 6.35);
    LIBS.translateY(leftFinger3.MOVE_MATRIX, 2.25);
    LIBS.translateZ(leftFinger3.MOVE_MATRIX, 2.6);
    LIBS.rotateX(leftFinger3.MOVE_MATRIX, LIBS.degToRad(100));
    LIBS.rotateY(leftFinger3.MOVE_MATRIX, LIBS.degToRad(30));
    LIBS.rotateZ(leftFinger3.MOVE_MATRIX, LIBS.degToRad(-120));

    LIBS.translateX(rightFinger1.MOVE_MATRIX, -0.3);
    LIBS.translateY(rightFinger1.MOVE_MATRIX, 2.2);
    LIBS.translateZ(rightFinger1.MOVE_MATRIX, 0.8);
    LIBS.rotateX(rightFinger1.MOVE_MATRIX, LIBS.degToRad(90));

    LIBS.translateX(rightFinger2.MOVE_MATRIX, -3.5);
    LIBS.translateY(rightFinger2.MOVE_MATRIX, 3.85);
    LIBS.translateZ(rightFinger2.MOVE_MATRIX, 2.7);
    LIBS.rotateX(rightFinger2.MOVE_MATRIX, LIBS.degToRad(100));
    LIBS.rotateY(rightFinger2.MOVE_MATRIX, LIBS.degToRad(-30));
    LIBS.rotateZ(rightFinger2.MOVE_MATRIX, LIBS.degToRad(60));

    LIBS.translateX(rightFinger3.MOVE_MATRIX, -6.35);
    LIBS.translateY(rightFinger3.MOVE_MATRIX, 2.25);
    LIBS.translateZ(rightFinger3.MOVE_MATRIX, 2.6);
    LIBS.rotateX(rightFinger3.MOVE_MATRIX, LIBS.degToRad(100));
    LIBS.rotateY(rightFinger3.MOVE_MATRIX, LIBS.degToRad(-30));
    LIBS.rotateZ(rightFinger3.MOVE_MATRIX, LIBS.degToRad(120));

    LIBS.translateX(leftFootClaw1.MOVE_MATRIX, 4.4);
    LIBS.translateY(leftFootClaw1.MOVE_MATRIX, -3.2);
    LIBS.translateZ(leftFootClaw1.MOVE_MATRIX, -2.1);
    LIBS.rotateX(leftFootClaw1.MOVE_MATRIX, LIBS.degToRad(-90));
    LIBS.rotateY(leftFootClaw1.MOVE_MATRIX, LIBS.degToRad(-70));
    LIBS.rotateZ(leftFootClaw1.MOVE_MATRIX, LIBS.degToRad(25));

    LIBS.translateX(leftFootClaw2.MOVE_MATRIX, 4.8);
    LIBS.translateY(leftFootClaw2.MOVE_MATRIX, -3.15);
    LIBS.translateZ(leftFootClaw2.MOVE_MATRIX, -1.95);
    LIBS.rotateX(leftFootClaw2.MOVE_MATRIX, LIBS.degToRad(-90));
    LIBS.rotateY(leftFootClaw2.MOVE_MATRIX, LIBS.degToRad(-70));
    LIBS.rotateZ(leftFootClaw2.MOVE_MATRIX, LIBS.degToRad(25));

    LIBS.translateX(leftFootClaw3.MOVE_MATRIX, 5.2);
    LIBS.translateY(leftFootClaw3.MOVE_MATRIX, -3.18);
    LIBS.translateZ(leftFootClaw3.MOVE_MATRIX, -2.1);
    LIBS.rotateX(leftFootClaw3.MOVE_MATRIX, LIBS.degToRad(-90));
    LIBS.rotateY(leftFootClaw3.MOVE_MATRIX, LIBS.degToRad(-70));
    LIBS.rotateZ(leftFootClaw3.MOVE_MATRIX, LIBS.degToRad(25));

    LIBS.translateX(rightFootClaw1.MOVE_MATRIX, 1.25);
    LIBS.translateY(rightFootClaw1.MOVE_MATRIX, -2.5);
    LIBS.translateZ(rightFootClaw1.MOVE_MATRIX, 2.1);
    LIBS.rotateX(rightFootClaw1.MOVE_MATRIX, LIBS.degToRad(-90));
    LIBS.rotateY(rightFootClaw1.MOVE_MATRIX, LIBS.degToRad(-70));
    LIBS.rotateZ(rightFootClaw1.MOVE_MATRIX, LIBS.degToRad(25));

    LIBS.translateX(rightFootClaw2.MOVE_MATRIX, 1.65);
    LIBS.translateY(rightFootClaw2.MOVE_MATRIX, -2.5);
    LIBS.translateZ(rightFootClaw2.MOVE_MATRIX, 2.3);
    LIBS.rotateX(rightFootClaw2.MOVE_MATRIX, LIBS.degToRad(-90));
    LIBS.rotateY(rightFootClaw2.MOVE_MATRIX, LIBS.degToRad(-70));
    LIBS.rotateZ(rightFootClaw2.MOVE_MATRIX, LIBS.degToRad(25));

    LIBS.translateX(rightFootClaw3.MOVE_MATRIX, 2.1);
    LIBS.translateY(rightFootClaw3.MOVE_MATRIX, -2.55);
    LIBS.translateZ(rightFootClaw3.MOVE_MATRIX, 2.15);
    LIBS.rotateX(rightFootClaw3.MOVE_MATRIX, LIBS.degToRad(-90));
    LIBS.rotateY(rightFootClaw3.MOVE_MATRIX, LIBS.degToRad(-70));
    LIBS.rotateZ(rightFootClaw3.MOVE_MATRIX, LIBS.degToRad(25));

    LIBS.translateY(tail.MOVE_MATRIX, 1.0);
    LIBS.translateZ(tail.MOVE_MATRIX, -2.5);
    LIBS.rotateX(tail.MOVE_MATRIX, LIBS.degToRad(-60));
    LIBS.rotateY(tail.MOVE_MATRIX, LIBS.degToRad(180));

    LIBS.translateY(tailTip.MOVE_MATRIX, 0.7);
    LIBS.translateZ(tailTip.MOVE_MATRIX, -3.0);
    LIBS.rotateX(tailTip.MOVE_MATRIX, LIBS.degToRad(-60));

    LIBS.translateY(tailTipFire.MOVE_MATRIX, 0.6);

    LIBS.translateY(neck.MOVE_MATRIX, 3.0);
    LIBS.translateZ(neck.MOVE_MATRIX, 0.4);
    LIBS.rotateX(neck.MOVE_MATRIX, LIBS.degToRad(10));

    LIBS.translateY(head.MOVE_MATRIX, 2.0);
    LIBS.translateZ(head.MOVE_MATRIX, 0.9);

    LIBS.translateY(upperMouth.MOVE_MATRIX, 10.0);
    LIBS.translateZ(upperMouth.MOVE_MATRIX, 4.3);
    LIBS.rotateX(upperMouth.MOVE_MATRIX, LIBS.degToRad(170));

    LIBS.translateY(lowerMouth.MOVE_MATRIX, 8.4);
    LIBS.translateZ(lowerMouth.MOVE_MATRIX, 5.7);
    LIBS.rotateX(lowerMouth.MOVE_MATRIX, LIBS.degToRad(190));

    LIBS.translateY(cheeks.MOVE_MATRIX, -0.4);
    LIBS.translateZ(cheeks.MOVE_MATRIX, 0.2);

    LIBS.translateX(upperTeethLeft.MOVE_MATRIX, 0.4);
    LIBS.translateY(upperTeethLeft.MOVE_MATRIX, 8.3); 
    LIBS.translateZ(upperTeethLeft.MOVE_MATRIX, -1.3);
    LIBS.rotateX(upperTeethLeft.MOVE_MATRIX, LIBS.degToRad(90));

    LIBS.translateX(upperTeethRight.MOVE_MATRIX, -0.4);
    LIBS.translateY(upperTeethRight.MOVE_MATRIX, 8.3); 
    LIBS.translateZ(upperTeethRight.MOVE_MATRIX, -1.3);
    LIBS.rotateX(upperTeethRight.MOVE_MATRIX, LIBS.degToRad(90));

    LIBS.translateX(lowerTeethLeft.MOVE_MATRIX, -0.2);
    LIBS.translateY(lowerTeethLeft.MOVE_MATRIX, 0.55);
    LIBS.translateZ(lowerTeethLeft.MOVE_MATRIX, 7.2);
    LIBS.rotateX(lowerTeethLeft.MOVE_MATRIX, LIBS.degToRad(-90));

    LIBS.translateX(lowerTeethRight.MOVE_MATRIX, 0.2);
    LIBS.translateY(lowerTeethRight.MOVE_MATRIX, 0.55);
    LIBS.translateZ(lowerTeethRight.MOVE_MATRIX, 7.2);
    LIBS.rotateX(lowerTeethRight.MOVE_MATRIX, LIBS.degToRad(-90));

    LIBS.translateY(tongue.MOVE_MATRIX, 0.25);
    LIBS.translateZ(tongue.MOVE_MATRIX, -0.1);

    LIBS.translateX(leftEyelid.MOVE_MATRIX, 0.4);
    LIBS.translateY(leftEyelid.MOVE_MATRIX, 0.3);
    LIBS.translateZ(leftEyelid.MOVE_MATRIX, 0.4);

    LIBS.translateX(rightEyelid.MOVE_MATRIX, -0.4);
    LIBS.translateY(rightEyelid.MOVE_MATRIX, 0.3);
    LIBS.translateZ(rightEyelid.MOVE_MATRIX, 0.4);

    LIBS.translateX(leftEyeWhite.MOVE_MATRIX, 0.1);
    LIBS.translateY(leftEyeWhite.MOVE_MATRIX, 0.3);
    LIBS.translateZ(leftEyeWhite.MOVE_MATRIX, -0.6);
    LIBS.rotateX(leftEyeWhite.MOVE_MATRIX, LIBS.degToRad(10));

    LIBS.translateX(rightEyeWhite.MOVE_MATRIX, -0.1);
    LIBS.translateY(rightEyeWhite.MOVE_MATRIX, 0.3);
    LIBS.translateZ(rightEyeWhite.MOVE_MATRIX, -0.6);
    LIBS.rotateX(rightEyeWhite.MOVE_MATRIX, LIBS.degToRad(10));

    LIBS.translateX(leftEyeBlack.MOVE_MATRIX, 0.2);
    LIBS.translateY(leftEyeBlack.MOVE_MATRIX, -0.05);
    LIBS.translateZ(leftEyeBlack.MOVE_MATRIX, 0.2);

    LIBS.translateX(rightEyeBlack.MOVE_MATRIX, -0.2);
    LIBS.translateY(rightEyeBlack.MOVE_MATRIX, -0.05);
    LIBS.translateZ(rightEyeBlack.MOVE_MATRIX, 0.2);
    // ========== ROTATE SCALE TRANSLATE END ==========

    // ========== CHILDS PUSH START ==========
    body.addChild(belly);
    body.addChild(leftThigh);
    body.addChild(rightThigh);
    body.addChild(leftShoulder);
    body.addChild(rightShoulder);
    body.addChild(tail);
    body.addChild(neck);
    neck.addChild(head);
    head.addChild(upperMouth);
    head.addChild(lowerMouth);
    head.addChild(cheeks);
    head.addChild(leftEyelid);
    head.addChild(rightEyelid);
    leftEyelid.addChild(leftEyeWhite);
    rightEyelid.addChild(rightEyeWhite);
    leftEyeWhite.addChild(leftEyeBlack);
    rightEyeWhite.addChild(rightEyeBlack);
    upperMouth.addChild(upperTeethLeft);
    upperMouth.addChild(upperTeethRight);
    lowerMouth.addChild(lowerTeethLeft);
    lowerMouth.addChild(lowerTeethRight);
    lowerMouth.addChild(tongue);
    tail.addChild(tailTip);
    tailTip.addChild(tailTipFire);
    leftShoulder.addChild(leftArm);
    rightShoulder.addChild(rightArm);
    leftArm.addChild(leftHandPalm);
    rightArm.addChild(rightHandPalm);
    leftHandPalm.addChild(leftFinger1);
    leftHandPalm.addChild(leftFinger2);
    leftHandPalm.addChild(leftFinger3);
    rightHandPalm.addChild(rightFinger1);
    rightHandPalm.addChild(rightFinger2);
    rightHandPalm.addChild(rightFinger3);
    leftThigh.addChild(leftLeg);
    rightThigh.addChild(rightLeg);
    leftLeg.addChild(leftFoot);
    rightLeg.addChild(rightFoot);
    leftFoot.addChild(leftFootClaw1);
    leftFoot.addChild(leftFootClaw2);
    leftFoot.addChild(leftFootClaw3);
    rightFoot.addChild(rightFootClaw1);
    rightFoot.addChild(rightFootClaw2);
    rightFoot.addChild(rightFootClaw3);
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