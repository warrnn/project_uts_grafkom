import { Object } from "../object.js";

function main() {
    var CANVAS = document.getElementById('myCanvas');
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    var THETA = 0, PHI = 0;
    var drag = false;
    var x_prev, y_prev;
    var FRICTION = 0.05;
    var dX = 0, dY = 0;
    var SPEED = 0.05
    var zoom = -60;

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

    var PROJMATRIX = LIBS.get_projection(60, CANVAS.width / CANVAS.height, 1, 100);
    var VIEWMATRIX = LIBS.get_I4();

    // ENVIROMENT OBJECT VARIABLE
    const { vertices: base_vertices, indices: base_indices } = generateHemisphereGradientClosed(24.0, 12, 64, [0.4, 0.25, 0.1], [0.2, 0.8, 0.2]);
    const base = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, base_vertices, base_indices, GL.TRIANGLES);

    const { vertices: tree_log_vertices, indices: tree_log_indices } = generateCylinderDynamicRadius(2.5, 1.0, 1.0, 2.5, 14.0, 32, 32, [0.5, 0.0, 0.0], "linear");
    const treeLog1 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tree_log_vertices, tree_log_indices, GL.TRIANGLES);
    const treeLog2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tree_log_vertices, tree_log_indices, GL.TRIANGLES);

    const { vertices: tree_leaves_vertices_1, indices: tree_leaves_indices_1 } = generateEllipsoid(3.0, 3.0, 3.0, 30, 30, [0.0, 0.5, 0.0]);
    const { vertices: tree_leaves_vertices_2, indices: tree_leaves_indices_2 } = generateEllipsoid(3.0, 3.0, 3.0, 30, 30, [0.2, 0.5, 0.0]);
    const { vertices: tree_leaves_vertices_3, indices: tree_leaves_indices_3 } = generateEllipsoid(3.0, 3.0, 3.0, 30, 30, [0.0, 0.5, 0.2]);
    const treeLeaves1 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tree_leaves_vertices_1, tree_leaves_indices_1, GL.TRIANGLES);
    const treeLeaves2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tree_leaves_vertices_1, tree_leaves_indices_1, GL.TRIANGLES);
    const treeLeaves3 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tree_leaves_vertices_2, tree_leaves_indices_2, GL.TRIANGLES);
    const treeLeaves4 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tree_leaves_vertices_2, tree_leaves_indices_2, GL.TRIANGLES);
    const treeLeaves5 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tree_leaves_vertices_2, tree_leaves_indices_2, GL.TRIANGLES);
    const treeLeaves6 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tree_leaves_vertices_2, tree_leaves_indices_2, GL.TRIANGLES);
    const treeLeaves7 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tree_leaves_vertices_3, tree_leaves_indices_3, GL.TRIANGLES);
    const treeLeaves8 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tree_leaves_vertices_3, tree_leaves_indices_3, GL.TRIANGLES);
    const treeLeaves9 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tree_leaves_vertices_3, tree_leaves_indices_3, GL.TRIANGLES);
    const treeLeaves10 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tree_leaves_vertices_3, tree_leaves_indices_3, GL.TRIANGLES);
    const treeLeaves11 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tree_leaves_vertices_1, tree_leaves_indices_1, GL.TRIANGLES);
    const treeLeaves12 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tree_leaves_vertices_1, tree_leaves_indices_1, GL.TRIANGLES);

    const { vertices: cloudbase_vertices, indices: cloudbase_indices } = generateEllipsoid(4.0, 2.5, 3.0, 30, 30, [1.0, 1.0, 1.0]);
    const cloudbase1 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, cloudbase_vertices, cloudbase_indices, GL.TRIANGLES);
    const cloudbase2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, cloudbase_vertices, cloudbase_indices, GL.TRIANGLES);
    const cloudbase3 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, cloudbase_vertices, cloudbase_indices, GL.TRIANGLES);

    const { vertices: cloud_vertices, indices: cloud_indices } = generateEllipsoid(2.5, 2.5, 2.5, 30, 30, [1.0, 1.0, 1.0]);
    const cloud1 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, cloud_vertices, cloud_indices, GL.TRIANGLES);
    const cloud2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, cloud_vertices, cloud_indices, GL.TRIANGLES);
    const cloud3 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, cloud_vertices, cloud_indices, GL.TRIANGLES);

    let rocks = [];
    for (let i = 0; i < 20; i++) {
        const rockSize = 1.0 + Math.random() * 0.5;

        const gray = 0.4 + Math.random() * 0.4;
        const colorVariation = (Math.random() - 0.5) * 0.05;
        const rockColor = [
            Math.min(1.0, Math.max(0.0, gray + colorVariation)),
            Math.min(1.0, Math.max(0.0, gray + colorVariation * 0.8)),
            Math.min(1.0, Math.max(0.0, gray + colorVariation * 0.6))
        ];

        const { vertices: rock_vertices, indices: rock_indices } = generateEllipsoid(rockSize, rockSize, rockSize, 4, 8, rockColor);

        rocks.push(new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, rock_vertices, rock_indices, GL.TRIANGLES));
    }

    const { vertices: rock_waterfall_vertices, indices: rock_waterfall_indices } = generateEllipsoid(7.0, 1., 3.5, 32, 12, [0.5, 0.5, 0.5]);
    const rockWaterfall = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, rock_waterfall_vertices, rock_waterfall_indices, GL.TRIANGLES);

    const { vertices: rock_water_vertices, indices: rock_water_indices } = generateEllipsoidGradient(5.8, 1.0, 3.5, 30, 30, [0.5, 0.5, 1.0], [0.0, 0.0, 1.0]);
    const waterRock = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, rock_water_vertices, rock_water_indices, GL.TRIANGLES);

    const { vertices: waterfall_vertices, indices: waterfall_indices } = generateVerticalPlaneGradient(7.0, 80.0, 30, 30, [1.0, 1.0, 1.0], [0.0, 0.0, 1.0]);
    const waterfall = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, waterfall_vertices, waterfall_indices, GL.TRIANGLES);

    let grasses = [];
    for (let i = 0; i < 100; i++) {
        const grassHeight = 3.0 + Math.random();

        const baseRed = 0.1 + Math.random() * 0.1;
        const baseGreen = 0.6 + Math.random() * 0.3;
        const baseBlue = 0.1 + Math.random() * 0.2;

        const variation = (Math.random() - 0.5) * 0.05;
        const grassColor = [
            Math.min(1.0, Math.max(0.0, baseRed + variation * 0.3)),
            Math.min(1.0, Math.max(0.0, baseGreen + variation)),
            Math.min(1.0, Math.max(0.0, baseBlue + variation * 0.2))
        ];

        const { vertices, indices } = generateCylinderDynamicRadius(0.5, 1.0, 0.0, 0.0, grassHeight, 8, 8, grassColor, "linear");

        grasses.push(new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, vertices, indices, GL.TRIANGLES));
    }
    // ENVIROMENT OBJECT VARIABLE END

    // CHARMANDER OBJECT VARIABLE
    const { vertices: charmander_body_vertices, indices: charmander_body_indices } = generateEllipsoid(1.1, 1.3, 0.8, 30, 30, [1.0, 0.5, 0.0]);
    const charmanderBody = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, charmander_body_vertices, charmander_body_indices, GL.TRIANGLES);

    const { vertices: charmander_head_vertices, indices: charmander_head_indices } = generateEllipsoid(0.8, 1.0, 0.9, 30, 30, [1.0, 0.5, 0.0]);
    const charmanderHead = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, charmander_head_vertices, charmander_head_indices, GL.TRIANGLES);

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

    const { vertices: charmander_tail_vertices, indices: charmander_tail_indices } = generateCurvedCylinder(0.4, 0.2, 1.5, 20, 10, [1.0, 0.5, 0.0]);
    const charmanderTail = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, charmander_tail_vertices, charmander_tail_indices, GL.TRIANGLES);

    const { vertices: charmander_tail_tip, indices: charmander_tail_tip_indices } = generateEllipsoidGradient(0.3, 0.3, 0.3, 30, 30, [1.0, 0.5, 0.0], [1.0, 1.0, 0.0]);
    const charmanderTailTip = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, charmander_tail_tip, charmander_tail_tip_indices, GL.TRIANGLES);

    const { vertices: charmander_fire_vertices, indices: charmander_fire_indices } = generateCylinderDynamicRadius(0.2, 0.5, 0.0, 0.0, 1.1, 32, 32, [1.0, 0.3, 0.0], "sin");
    const charmanderTailTipFire = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, charmander_fire_vertices, charmander_fire_indices, GL.TRIANGLES);

    const { vertices: charmander_belly_vertices, indices: charmander_belly_indices } = generateEllipsoid(0.9, 1.05, 0.4, 30, 30, [1.0, 1.0, 0.6]);
    const charmanderBelly = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, charmander_belly_vertices, charmander_belly_indices, GL.TRIANGLES);

    const { vertices: charmander_shoulder_vertices, indices: charmander_shoulder_indices } = generateEllipsoid(0.3, 0.3, 0.3, 30, 30, [1.0, 0.5, 0.0]);
    const charmanderLeftarmShoulder = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, charmander_shoulder_vertices, charmander_shoulder_indices, GL.TRIANGLES);
    const charmanderRightarmShoulder = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, charmander_shoulder_vertices, charmander_shoulder_indices, GL.TRIANGLES);

    const { vertices: charmander_arm_vertices, indices: charmander_arm_indices } = generateEllipsoid(0.6, 0.3, 0.3, 30, 30, [1.0, 0.5, 0.0]);
    const charmanderLeftArm = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, charmander_arm_vertices, charmander_arm_indices, GL.TRIANGLES);
    const charmanderRightArm = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, charmander_arm_vertices, charmander_arm_indices, GL.TRIANGLES);

    const { vertices: charmander_leg_vertices, indices: charmander_leg_indices } = generateEllipsoid(0.4, 0.8, 0.4, 30, 30, [1.0, 0.5, 0.0]);
    const charmanderLeftLeg = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, charmander_leg_vertices, charmander_leg_indices, GL.TRIANGLES);
    const charmanderRightLeg = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, charmander_leg_vertices, charmander_leg_indices, GL.TRIANGLES);

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
    // CHARMANDER OBJECT VARIABLE END

    // CHARMELEON OBJECT VARIABLE
    // ...
    // CHARMELEON OBJECT VARIABLE END

    // CHARIZARD OBJECT VARIABLE
    const { vertices: body_vertices, indices: body_indices } = generateEllipsoid(2.1, 2.4, 1.5, 30, 30, [1.0, 0.5, 0.0]);
    const charizardBody = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, body_vertices, body_indices, GL.TRIANGLES);

    const { vertices: belly_vertices, indices: belly_indices } = generateEllipsoid(1.9, 2.1, 1.2, 30, 30, [1.0, 1.0, 0.6]);
    const charizardBelly = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, belly_vertices, belly_indices, GL.TRIANGLES);

    const { vertices: thigh_vertices, indices: thigh_indices } = generateEllipsoid(1.0, 1.0, 1.0, 30, 30, [1.0, 0.5, 0.0]);
    const charizardLeftThigh = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, thigh_vertices, thigh_indices, GL.TRIANGLES);
    const charizardRightThigh = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, thigh_vertices, thigh_indices, GL.TRIANGLES);

    const { vertices: leg_vertices, indices: leg_indices } = generateEllipsoid(0.9, 1.5, 1.0, 30, 30, [1.0, 0.5, 0.0]);
    const charizardLeftLeg = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leg_vertices, leg_indices, GL.TRIANGLES);
    const charizardRightLeg = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, leg_vertices, leg_indices, GL.TRIANGLES);

    const { vertices: foots_vertices, indices: foots_indices } = generateEllipsoid(0.9, 0.4, 1.3, 30, 30, [1.0, 0.5, 0.0]);
    const charizardLeftFoot = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, foots_vertices, foots_indices, GL.TRIANGLES);
    const charizardRightFoot = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, foots_vertices, foots_indices, GL.TRIANGLES);

    const { vertices: shoulder_vertices, indices: shoulder_indices } = generateEllipsoid(0.9, 0.6, 0.6, 30, 30, [1.0, 0.5, 0.0]);
    const charizardLeftShoulder = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, shoulder_vertices, shoulder_indices, GL.TRIANGLES);
    const charizardRightShoulder = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, shoulder_vertices, shoulder_indices, GL.TRIANGLES);

    const { vertices: arm_vertices, indices: arm_indices } = generateCurvedByStrengthCylinder(0.3, 0.3, 2.5, 30, 30, [1.0, 0.5, 0.0], 0.5);
    const charizardLeftArm = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, arm_vertices, arm_indices, GL.TRIANGLES);
    const charizardRightArm = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, arm_vertices, arm_indices, GL.TRIANGLES);

    const { vertices: hand_palm_vertices, indices: hand_palm_indices } = generateEllipsoid(0.5, 0.5, 0.25, 30, 30, [1.0, 0.5, 0.0]);
    const charizardLeftHandPalm = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, hand_palm_vertices, hand_palm_indices, GL.TRIANGLES);
    const charizardRightHandPalm = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, hand_palm_vertices, hand_palm_indices, GL.TRIANGLES);

    const { vertices: foot_claw_vertices, indices: foot_claw_indices } = generateEllipticParaboloid(0.15, 0.15, 0.8, 20, 10, [1.0, 1.0, 1.0]);
    const charizardLeftFootClaw1 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, foot_claw_vertices, foot_claw_indices, GL.TRIANGLES);
    const charizardLeftFootClaw2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, foot_claw_vertices, foot_claw_indices, GL.TRIANGLES);
    const charizardLeftFootClaw3 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, foot_claw_vertices, foot_claw_indices, GL.TRIANGLES);
    const charizardRightFootClaw1 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, foot_claw_vertices, foot_claw_indices, GL.TRIANGLES);
    const charizardRightFootClaw2 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, foot_claw_vertices, foot_claw_indices, GL.TRIANGLES);
    const charizardRightFootClaw3 = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, foot_claw_vertices, foot_claw_indices, GL.TRIANGLES);

    const { vertices: tail_vertices, indices: tail_indices } = generateCurvedCylinder(0.4, 0.2, 3.5, 20, 10, [1.0, 0.5, 0.0]);
    const charizardTail = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tail_vertices, tail_indices, GL.TRIANGLES);

    const { vertices: tail_tip, indices: tail_tip_indices } = generateEllipsoidGradient(0.6, 0.6, 0.6, 30, 30, [1.0, 0.5, 0.0], [1.0, 1.0, 0.0]);
    const charizardTailTip = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tail_tip, tail_tip_indices, GL.TRIANGLES);

    const { vertices: fire_vertices, indices: fire_indices } = generateCylinderDynamicRadius(0.6, 0.88, 0.0, .0, 1.1, 32, 32, [1.0, 0.3, 0.0], "sin");
    const charizardTailTipFire = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, fire_vertices, fire_indices, GL.TRIANGLES);

    const { vertices: neck_vertices, indices: neck_indices } = generateCylinderDynamicRadius(0.9, 0.9, 0.4, 0.4, 4.0, 32, 32, [1.0, 0.5, 0.0], "cos");
    const charizardNeck = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, neck_vertices, neck_indices, GL.TRIANGLES);

    const { vertices: head_vertices, indices: head_indices } = generateEllipsoid(1.1, 0.9, 1.0, 30, 30, [1.0, 0.5, 0.0]);
    const charizardHead = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, head_vertices, head_indices, GL.TRIANGLES);

    const { vertices: upper_mouth_vertices, indices: upper_mouth_indices } = generateEllipticParaboloidFlexible(1.0, 0.5, 2.2, 30, 30, 0.2, [1.0, 0.5, 0.0]);
    const charizardUpperMouth = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, upper_mouth_vertices, upper_mouth_indices, GL.TRIANGLES);

    const { vertices: lower_mouth_vertices, indices: lower_mouth_indices } = generateEllipticParaboloidFlexible(0.85, 0.4, 2.0, 30, 30, 0.2, [1.0, 0.5, 0.0]);
    const charizardLowerMouth = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, lower_mouth_vertices, lower_mouth_indices, GL.TRIANGLES);

    const { vertices: cheeks_vertices, indices: cheeks_indices } = generateEllipsoid(1.1, 0.65, 0.8, 30, 30, [1.0, 0.5, 0.0]);
    const charizardCheeks = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, cheeks_vertices, cheeks_indices, GL.TRIANGLES);

    const { vertices: upper_teeth_vertices, indices: upper_teeth_indices } = generateEllipticParaboloid(0.1, 0.1, 0.3, 20, 10, [1.0, 1.0, 1.0]);
    const charizardUpperTeethLeft = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, upper_teeth_vertices, upper_teeth_indices, GL.TRIANGLES);
    const charizardUpperTeethRight = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, upper_teeth_vertices, upper_teeth_indices, GL.TRIANGLES);

    const { vertices: lower_teeth_vertices, indices: lower_teeth_indices } = generateEllipticParaboloid(0.05, 0.05, 0.2, 20, 10, [1.0, 1.0, 1.0]);
    const charizardLowerTeethLeft = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, lower_teeth_vertices, lower_teeth_indices, GL.TRIANGLES);
    const charizardLowerTeethRight = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, lower_teeth_vertices, lower_teeth_indices, GL.TRIANGLES);

    const { vertices: tongue_vertices, indices: tongue_indices } = generateEllipticParaboloid(0.7, 0.3, 1.8, 20, 10, [1.0, 0.6, 0.8]);
    const charizardTongue = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, tongue_vertices, tongue_indices, GL.TRIANGLES);

    const { vertices: eyelid_vertices, indices: eyelid_indices } = generateEllipsoid(0.5, 0.4, 1.1, 30, 30, [1.0, 0.5, 0.0]);
    const charizardLeftEyelid = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyelid_vertices, eyelid_indices, GL.TRIANGLES);
    const charizardRightEyelid = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eyelid_vertices, eyelid_indices, GL.TRIANGLES);

    const { vertices: eye_white_vertices, indices: eye_white_indices } = generateEllipsoid(0.5, 0.3, 0.6, 30, 30, [1.0, 1.0, 1.0]);
    const charizardLeftEyeWhite = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eye_white_vertices, eye_white_indices, GL.TRIANGLES);
    const charizardRightEyeWhite = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eye_white_vertices, eye_white_indices, GL.TRIANGLES);

    const { vertices: eye_black_vertices, indices: eye_black_indices } = generateEllipsoid(0.3, 0.2, 0.5, 30, 30, [0.0, 0.0, 0.0]);
    const charizardLeftEyeBlack = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eye_black_vertices, eye_black_indices, GL.TRIANGLES);
    const charizardRightEyeBlack = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, eye_black_vertices, eye_black_indices, GL.TRIANGLES);

    const { vertices: horn_vertices, indices: horn_indices } = generateEllipticParaboloidFlexible(0.25, 0.25, 2.0, 30, 30, 0.2, [1.0, 0.5, 0.0]);
    const charizardLeftHorn = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, horn_vertices, horn_indices, GL.TRIANGLES);
    const charizardRightHorn = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, horn_vertices, horn_indices, GL.TRIANGLES);

    const charizardWingPointsLeft = [
        [1.0, 1.0, 1.0],
        [2.0, 1.0, 1.0],
        [3.0, 2.0, 1.0],
        [4.0, 2.0, 1.0],

        [5.0, -1.0, 0.0],
        [4.0, 2.0, 0.0],
        [5.0, -3.0, 0.0],

        [5.0, -9.0, 0.0],
        [4.0, 2.0, 0.0],
        [4.0, -3.0, 0.0],

        [2.0, -8.0, 0.0],
        [4.0, 2.0, 0.0],
        [1.5, -3.5, 0.0],
    ];
    const { vertices: wing_membrane_left_vertices, indices: wing_membrane_left_indices } = generateWingFanBezier3D(charizardWingPointsLeft, 30, [0.3, 0.4, 1.0]);
    const charizardLeftWingMembrane = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, wing_membrane_left_vertices, wing_membrane_left_indices, GL.TRIANGLE_FAN);

    const charizardWingPointsLeftClose = [
        [1.05, 1.1, 1.05],
        [2.1, 1.05, 1.05],
        [3.15, 2.1, 1.05],
        [4.2, 2.1, 1.05],

        [5.25, -1.05, 0.0],
        [4.2, 2.1, 0.0],
        [5.25, -3.15, 0.0],

        [5.25, -9.45, 0.0],
        [4.2, 2.1, 0.0],
        [4.2, -3.15, 0.0],

        [2.1, -8.4, 0.0],
        [4.2, 2.1, 0.0],
        [1.575, -3.675, 0.0],
    ];
    const { vertices: wing_membrane_left_close_vertices, indices: wing_membrane_left_close_indices } = generateWingFanBezier3D(charizardWingPointsLeftClose, 30, [1.0, 0.55, 0.0]);
    const charizardLeftWingMembraneClose = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, wing_membrane_left_close_vertices, wing_membrane_left_close_indices, GL.TRIANGLE_FAN);

    const charizardWingPointsRight = charizardWingPointsLeft.map(p => [-p[0], p[1], p[2]]);
    const { vertices: wing_membrane_right_vertices, indices: wing_membrane_right_indices } = generateWingFanBezier3D(charizardWingPointsRight, 30, [0.3, 0.4, 1.0]);
    const charizardRightWingMembrane = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, wing_membrane_right_vertices, wing_membrane_right_indices, GL.TRIANGLE_FAN);

    const charizardWingPointsRightClose = charizardWingPointsLeftClose.map(p => [-p[0], p[1], p[2]]);
    const { vertices: wing_membrane_right_close_vertices, indices: wing_membrane_right_close_indices } = generateWingFanBezier3D(charizardWingPointsRightClose, 30, [1.0, 0.55, 0.0]);
    const charizardRightWingMembraneClose = new Object(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, wing_membrane_right_close_vertices, wing_membrane_right_close_indices, GL.TRIANGLE_FAN);
    // CHARMANDER OBJECT VARIABLE END

    // ENVIRONMENT TRANSFORMATION
    LIBS.translateY(base.MOVE_MATRIX, -1.7);
    LIBS.rotateX(base.MOVE_MATRIX, -Math.PI);

    LIBS.translateX(treeLog1.MOVE_MATRIX, 10.0);
    LIBS.translateY(treeLog1.MOVE_MATRIX, 5.0);
    LIBS.translateZ(treeLog1.MOVE_MATRIX, -10.0);

    LIBS.translateX(treeLog2.MOVE_MATRIX, -10.0);
    LIBS.translateY(treeLog2.MOVE_MATRIX, 5.0);
    LIBS.translateZ(treeLog2.MOVE_MATRIX, -10.0);

    LIBS.translateX(treeLeaves1.MOVE_MATRIX, -10.0);
    LIBS.translateY(treeLeaves1.MOVE_MATRIX, 12.0);
    LIBS.translateZ(treeLeaves1.MOVE_MATRIX, -10.0);

    LIBS.translateX(treeLeaves2.MOVE_MATRIX, 10.0);
    LIBS.translateY(treeLeaves2.MOVE_MATRIX, 12.0);
    LIBS.translateZ(treeLeaves2.MOVE_MATRIX, -10.0);

    LIBS.translateX(treeLeaves3.MOVE_MATRIX, -12.0);
    LIBS.translateY(treeLeaves3.MOVE_MATRIX, 12.0);
    LIBS.translateZ(treeLeaves3.MOVE_MATRIX, -10.0);

    LIBS.translateX(treeLeaves4.MOVE_MATRIX, 12.0);
    LIBS.translateY(treeLeaves4.MOVE_MATRIX, 12.0);
    LIBS.translateZ(treeLeaves4.MOVE_MATRIX, -10.0);

    LIBS.translateX(treeLeaves5.MOVE_MATRIX, -8.0);
    LIBS.translateY(treeLeaves5.MOVE_MATRIX, 12.0);
    LIBS.translateZ(treeLeaves5.MOVE_MATRIX, -10.0);

    LIBS.translateX(treeLeaves6.MOVE_MATRIX, 8.0);
    LIBS.translateY(treeLeaves6.MOVE_MATRIX, 12.0);
    LIBS.translateZ(treeLeaves6.MOVE_MATRIX, -10.0);

    LIBS.translateX(treeLeaves7.MOVE_MATRIX, -10.0);
    LIBS.translateY(treeLeaves7.MOVE_MATRIX, 12.0);
    LIBS.translateZ(treeLeaves7.MOVE_MATRIX, -8.0);

    LIBS.translateX(treeLeaves8.MOVE_MATRIX, 10.0);
    LIBS.translateY(treeLeaves8.MOVE_MATRIX, 12.0);
    LIBS.translateZ(treeLeaves8.MOVE_MATRIX, -8.0);

    LIBS.translateX(treeLeaves9.MOVE_MATRIX, -10.0);
    LIBS.translateY(treeLeaves9.MOVE_MATRIX, 12.0);
    LIBS.translateZ(treeLeaves9.MOVE_MATRIX, -12.0);

    LIBS.translateX(treeLeaves10.MOVE_MATRIX, 10.0);
    LIBS.translateY(treeLeaves10.MOVE_MATRIX, 12.0);
    LIBS.translateZ(treeLeaves10.MOVE_MATRIX, -12.0);

    LIBS.translateX(treeLeaves11.MOVE_MATRIX, -10.0);
    LIBS.translateY(treeLeaves11.MOVE_MATRIX, 14.0);
    LIBS.translateZ(treeLeaves11.MOVE_MATRIX, -10.0);

    LIBS.translateX(treeLeaves12.MOVE_MATRIX, 10.0);
    LIBS.translateY(treeLeaves12.MOVE_MATRIX, 14.0);
    LIBS.translateZ(treeLeaves12.MOVE_MATRIX, -10.0);

    LIBS.translateX(cloudbase1.MOVE_MATRIX, -16.0);
    LIBS.translateY(cloudbase1.MOVE_MATRIX, 20.0);
    LIBS.translateZ(cloudbase1.MOVE_MATRIX, -16.0);

    LIBS.translateY(cloud1.MOVE_MATRIX, 2.0);

    LIBS.translateX(cloudbase2.MOVE_MATRIX, 0.0);
    LIBS.translateY(cloudbase2.MOVE_MATRIX, 22.0);
    LIBS.translateZ(cloudbase2.MOVE_MATRIX, -16.0);

    LIBS.translateY(cloud2.MOVE_MATRIX, 2.0);

    LIBS.translateX(cloudbase3.MOVE_MATRIX, 16.0);
    LIBS.translateY(cloudbase3.MOVE_MATRIX, 18.0);
    LIBS.translateZ(cloudbase3.MOVE_MATRIX, -16.0);

    LIBS.translateY(cloud3.MOVE_MATRIX, 2.0);

    rocks.forEach(rock => {
        LIBS.translateX(rock.MOVE_MATRIX, Math.random() * 40.0 - 20.0);
        LIBS.translateY(rock.MOVE_MATRIX, -2.0);

        let z = (Math.random() < 0.5) ? (Math.random() * -7.0 - 4.0) : (Math.random() * 7.0 + 4.0);
        LIBS.translateZ(rock.MOVE_MATRIX, z);
    })

    LIBS.translateY(rockWaterfall.MOVE_MATRIX, -2.0);
    LIBS.translateZ(rockWaterfall.MOVE_MATRIX, 22.0);

    LIBS.translateY(waterfall.MOVE_MATRIX, -42.0);
    LIBS.translateZ(waterfall.MOVE_MATRIX, 25.0);

    LIBS.translateY(waterRock.MOVE_MATRIX, -1.9);
    LIBS.translateZ(waterRock.MOVE_MATRIX, 22.4);

    grasses.forEach(grass => {
        LIBS.translateX(grass.MOVE_MATRIX, Math.random() * 40.0 - 20.0);
        LIBS.translateY(grass.MOVE_MATRIX, -2.0);

        let z = (Math.random() < 0.5) ? (Math.random() * -9.0 - 4.0) : (Math.random() * 9.0 + 4.0);
        LIBS.translateZ(grass.MOVE_MATRIX, z);
    })
    // ENVIRONMENT TRANSFORMATION END

    // CHARMANDER TRANSFORMATION
    LIBS.translateX(charmanderBody.MOVE_MATRIX, -9.0);

    LIBS.translateX(charmanderHead.MOVE_MATRIX, -9.0);
    LIBS.translateY(charmanderHead.MOVE_MATRIX, 1.6);
    LIBS.translateZ(charmanderHead.MOVE_MATRIX, 0.1);

    LIBS.translateX(charmanderLeftEyebrow.MOVE_MATRIX, -6.0);
    LIBS.translateY(charmanderLeftEyebrow.MOVE_MATRIX, 10.7);
    LIBS.translateZ(charmanderLeftEyebrow.MOVE_MATRIX, -0.6);
    LIBS.rotateX(charmanderLeftEyebrow.MOVE_MATRIX, LIBS.degToRad(45));
    LIBS.rotateZ(charmanderLeftEyebrow.MOVE_MATRIX, LIBS.degToRad(75));

    LIBS.translateX(charmanderRightEyebrow.MOVE_MATRIX, -12.8);
    LIBS.translateY(charmanderRightEyebrow.MOVE_MATRIX, 10.33);
    LIBS.translateZ(charmanderRightEyebrow.MOVE_MATRIX, -0.5);
    LIBS.rotateX(charmanderRightEyebrow.MOVE_MATRIX, LIBS.degToRad(-225));
    LIBS.rotateZ(charmanderRightEyebrow.MOVE_MATRIX, LIBS.degToRad(-250));

    LIBS.translateX(charmanderLeftEye.MOVE_MATRIX, -3.6);
    LIBS.translateY(charmanderLeftEye.MOVE_MATRIX, 0.3);
    LIBS.translateZ(charmanderLeftEye.MOVE_MATRIX, 7.6);
    LIBS.rotateY(charmanderLeftEye.MOVE_MATRIX, LIBS.degToRad(-50));

    LIBS.translateX(charmanderLeftEyePupil.MOVE_MATRIX, 0.02);
    LIBS.translateY(charmanderLeftEyePupil.MOVE_MATRIX, 0.07);
    LIBS.translateZ(charmanderLeftEyePupil.MOVE_MATRIX, 0.09);

    LIBS.translateX(charmanderRightEye.MOVE_MATRIX, -2.75);
    LIBS.translateY(charmanderRightEye.MOVE_MATRIX, 0.3);
    LIBS.translateZ(charmanderRightEye.MOVE_MATRIX, -6.3);
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

    LIBS.translateX(charmanderTail.MOVE_MATRIX, -9.0);
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

    LIBS.translateX(charmanderLeftarmShoulder.MOVE_MATRIX, -9.8);
    LIBS.translateY(charmanderLeftarmShoulder.MOVE_MATRIX, 0.6);

    LIBS.translateX(charmanderLeftArm.MOVE_MATRIX, -0.75);
    LIBS.translateY(charmanderLeftArm.MOVE_MATRIX, -4.2);
    LIBS.translateZ(charmanderLeftArm.MOVE_MATRIX, 5.0);
    LIBS.rotateY(charmanderLeftArm.MOVE_MATRIX, LIBS.degToRad(-30));
    LIBS.rotateZ(charmanderLeftArm.MOVE_MATRIX, LIBS.degToRad(-30));

    LIBS.translateX(charmanderRightarmShoulder.MOVE_MATRIX, -8.2);
    LIBS.translateY(charmanderRightarmShoulder.MOVE_MATRIX, 0.6);

    LIBS.translateX(charmanderRightArm.MOVE_MATRIX, -3.8);
    LIBS.translateY(charmanderRightArm.MOVE_MATRIX, 3.55);
    LIBS.translateZ(charmanderRightArm.MOVE_MATRIX, -4.0);
    LIBS.rotateY(charmanderRightArm.MOVE_MATRIX, LIBS.degToRad(30));
    LIBS.rotateZ(charmanderRightArm.MOVE_MATRIX, LIBS.degToRad(30));

    LIBS.translateX(charmanderLeftLeg.MOVE_MATRIX, -8.3);
    LIBS.translateY(charmanderLeftLeg.MOVE_MATRIX, -0.8);

    LIBS.translateX(charmanderRightLeg.MOVE_MATRIX, -9.7);
    LIBS.translateY(charmanderRightLeg.MOVE_MATRIX, -0.8);

    LIBS.translateY(charmanderLeftLegAnkle.MOVE_MATRIX, -0.55);

    LIBS.translateY(charmanderRightLegAnkle.MOVE_MATRIX, -0.55);

    LIBS.translateX(charmanderLeftLegFoot.MOVE_MATRIX, 0.1);
    LIBS.translateY(charmanderLeftLegFoot.MOVE_MATRIX, -0.15);
    LIBS.translateZ(charmanderLeftLegFoot.MOVE_MATRIX, 0.25);

    LIBS.translateX(charmanderRightLegFoot.MOVE_MATRIX, -0.1);
    LIBS.translateY(charmanderRightLegFoot.MOVE_MATRIX, -0.15);
    LIBS.translateZ(charmanderRightLegFoot.MOVE_MATRIX, 0.25);

    LIBS.translateX(charmanderLeftLegClaw1.MOVE_MATRIX, -0.0);
    LIBS.translateY(charmanderLeftLegClaw1.MOVE_MATRIX, -2.85);
    LIBS.translateZ(charmanderLeftLegClaw1.MOVE_MATRIX, 0.85);
    LIBS.rotateX(charmanderLeftLegClaw1.MOVE_MATRIX, LIBS.degToRad(180));

    LIBS.translateX(charmanderLeftLegClaw2.MOVE_MATRIX, 0.15);
    LIBS.translateY(charmanderLeftLegClaw2.MOVE_MATRIX, -2.85);
    LIBS.translateZ(charmanderLeftLegClaw2.MOVE_MATRIX, 0.85);
    LIBS.rotateX(charmanderLeftLegClaw2.MOVE_MATRIX, LIBS.degToRad(180));

    LIBS.translateX(charmanderLeftLegClaw3.MOVE_MATRIX, 0.30);
    LIBS.translateY(charmanderLeftLegClaw3.MOVE_MATRIX, -2.85);
    LIBS.translateZ(charmanderLeftLegClaw3.MOVE_MATRIX, 0.75);
    LIBS.rotateX(charmanderLeftLegClaw3.MOVE_MATRIX, LIBS.degToRad(180));

    LIBS.translateX(charmanderRightLegClaw1.MOVE_MATRIX, 0.0);
    LIBS.translateY(charmanderRightLegClaw1.MOVE_MATRIX, -2.85);
    LIBS.translateZ(charmanderRightLegClaw1.MOVE_MATRIX, 0.85);
    LIBS.rotateX(charmanderRightLegClaw1.MOVE_MATRIX, LIBS.degToRad(180));

    LIBS.translateX(charmanderRightLegClaw2.MOVE_MATRIX, -0.15);
    LIBS.translateY(charmanderRightLegClaw2.MOVE_MATRIX, -2.85);
    LIBS.translateZ(charmanderRightLegClaw2.MOVE_MATRIX, 0.85);
    LIBS.rotateX(charmanderRightLegClaw2.MOVE_MATRIX, LIBS.degToRad(180));

    LIBS.translateX(charmanderRightLegClaw3.MOVE_MATRIX, -0.30);
    LIBS.translateY(charmanderRightLegClaw3.MOVE_MATRIX, -2.85);
    LIBS.translateZ(charmanderRightLegClaw3.MOVE_MATRIX, 0.75);
    LIBS.rotateX(charmanderRightLegClaw3.MOVE_MATRIX, LIBS.degToRad(180));
    // CHARMANDER TRANSFORMATION END

    // CHARMELEON TRANSFORMATION
    // ...
    // CHARMELEON TRANSFORMATION END

    // CHARIZARD TRANSFORMATION
    LIBS.translateX(charizardBody.MOVE_MATRIX, 9.0);
    LIBS.translateY(charizardBody.MOVE_MATRIX, 2.0);

    LIBS.translateY(charizardBelly.MOVE_MATRIX, -0.2);
    LIBS.translateZ(charizardBelly.MOVE_MATRIX, 0.2);
    LIBS.rotateX(charizardBelly.MOVE_MATRIX, LIBS.degToRad(5));

    LIBS.translateX(charizardLeftThigh.MOVE_MATRIX, 10.3);
    LIBS.translateY(charizardLeftThigh.MOVE_MATRIX, 0.4);

    LIBS.translateX(charizardRightThigh.MOVE_MATRIX, 7.3);
    LIBS.translateY(charizardRightThigh.MOVE_MATRIX, 0.4);

    LIBS.translateX(charizardLeftLeg.MOVE_MATRIX, 0.35);
    LIBS.translateY(charizardLeftLeg.MOVE_MATRIX, -0.5);
    LIBS.translateZ(charizardLeftLeg.MOVE_MATRIX, 0.2);

    LIBS.translateX(charizardRightLeg.MOVE_MATRIX, -0.35);
    LIBS.translateY(charizardRightLeg.MOVE_MATRIX, -0.5);
    LIBS.translateZ(charizardRightLeg.MOVE_MATRIX, 0.2);

    LIBS.translateY(charizardLeftFoot.MOVE_MATRIX, -1.2);
    LIBS.translateZ(charizardLeftFoot.MOVE_MATRIX, 0.4);
    LIBS.rotateX(charizardLeftFoot.MOVE_MATRIX, LIBS.degToRad(15));

    LIBS.translateY(charizardRightFoot.MOVE_MATRIX, -1.2);
    LIBS.translateZ(charizardRightFoot.MOVE_MATRIX, 0.4);
    LIBS.rotateX(charizardRightFoot.MOVE_MATRIX, LIBS.degToRad(15));

    LIBS.translateX(charizardLeftShoulder.MOVE_MATRIX, 10.4);
    LIBS.translateY(charizardLeftShoulder.MOVE_MATRIX, 3.0);
    LIBS.translateZ(charizardLeftShoulder.MOVE_MATRIX, 0.2);

    LIBS.translateX(charizardRightShoulder.MOVE_MATRIX, 7.45);
    LIBS.translateY(charizardRightShoulder.MOVE_MATRIX, 3.0);
    LIBS.translateZ(charizardRightShoulder.MOVE_MATRIX, 0.2);

    LIBS.translateX(charizardLeftArm.MOVE_MATRIX, 13.6);
    LIBS.translateY(charizardLeftArm.MOVE_MATRIX, -7.0);
    LIBS.translateZ(charizardLeftArm.MOVE_MATRIX, -3.0);
    LIBS.rotateY(charizardLeftArm.MOVE_MATRIX, LIBS.degToRad(-30));
    LIBS.rotateZ(charizardLeftArm.MOVE_MATRIX, LIBS.degToRad(90));

    LIBS.translateX(charizardRightArm.MOVE_MATRIX, 3.7);
    LIBS.translateY(charizardRightArm.MOVE_MATRIX, 8.4);
    LIBS.translateZ(charizardRightArm.MOVE_MATRIX, 5.8);
    LIBS.rotateY(charizardRightArm.MOVE_MATRIX, LIBS.degToRad(30));
    LIBS.rotateZ(charizardRightArm.MOVE_MATRIX, LIBS.degToRad(-90));

    LIBS.translateX(charizardLeftHandPalm.MOVE_MATRIX, 4.3);
    LIBS.translateY(charizardLeftHandPalm.MOVE_MATRIX, 0.9);
    LIBS.translateZ(charizardLeftHandPalm.MOVE_MATRIX, -6.4);
    LIBS.rotateY(charizardLeftHandPalm.MOVE_MATRIX, LIBS.degToRad(-30));

    LIBS.translateX(charizardRightHandPalm.MOVE_MATRIX, -1.9);
    LIBS.translateY(charizardRightHandPalm.MOVE_MATRIX, 0.9);
    LIBS.translateZ(charizardRightHandPalm.MOVE_MATRIX, 2.2);
    LIBS.rotateY(charizardRightHandPalm.MOVE_MATRIX, LIBS.degToRad(30));

    LIBS.translateX(charizardLeftFootClaw1.MOVE_MATRIX, 9.2 - 8.9);
    LIBS.translateY(charizardLeftFootClaw1.MOVE_MATRIX, -3.2);
    LIBS.translateZ(charizardLeftFootClaw1.MOVE_MATRIX, 2.75);
    LIBS.rotateX(charizardLeftFootClaw1.MOVE_MATRIX, LIBS.degToRad(-180));

    LIBS.translateX(charizardLeftFootClaw2.MOVE_MATRIX, 8.9 - 8.9);
    LIBS.translateY(charizardLeftFootClaw2.MOVE_MATRIX, -3.2);
    LIBS.translateZ(charizardLeftFootClaw2.MOVE_MATRIX, 2.85);
    LIBS.rotateX(charizardLeftFootClaw2.MOVE_MATRIX, LIBS.degToRad(-180));

    LIBS.translateX(charizardLeftFootClaw3.MOVE_MATRIX, 8.6 - 8.9);
    LIBS.translateY(charizardLeftFootClaw3.MOVE_MATRIX, -3.2);
    LIBS.translateZ(charizardLeftFootClaw3.MOVE_MATRIX, 2.75);
    LIBS.rotateX(charizardLeftFootClaw3.MOVE_MATRIX, LIBS.degToRad(-180));

    LIBS.translateX(charizardRightFootClaw1.MOVE_MATRIX, 9.2 - 8.9);
    LIBS.translateY(charizardRightFootClaw1.MOVE_MATRIX, -3.2);
    LIBS.translateZ(charizardRightFootClaw1.MOVE_MATRIX, 2.75);
    LIBS.rotateX(charizardRightFootClaw1.MOVE_MATRIX, LIBS.degToRad(-180));

    LIBS.translateX(charizardRightFootClaw2.MOVE_MATRIX, 8.9 - 8.9);
    LIBS.translateY(charizardRightFootClaw2.MOVE_MATRIX, -3.2);
    LIBS.translateZ(charizardRightFootClaw2.MOVE_MATRIX, 2.85);
    LIBS.rotateX(charizardRightFootClaw2.MOVE_MATRIX, LIBS.degToRad(-180));

    LIBS.translateX(charizardRightFootClaw3.MOVE_MATRIX, 8.6 - 8.9);
    LIBS.translateY(charizardRightFootClaw3.MOVE_MATRIX, -3.2);
    LIBS.translateZ(charizardRightFootClaw3.MOVE_MATRIX, 2.75);
    LIBS.rotateX(charizardRightFootClaw3.MOVE_MATRIX, LIBS.degToRad(-180));

    LIBS.translateX(charizardTail.MOVE_MATRIX, 9.0);
    LIBS.translateY(charizardTail.MOVE_MATRIX, 3.0);
    LIBS.translateZ(charizardTail.MOVE_MATRIX, -2.5);
    LIBS.rotateX(charizardTail.MOVE_MATRIX, LIBS.degToRad(-60));
    LIBS.rotateY(charizardTail.MOVE_MATRIX, LIBS.degToRad(180));

    LIBS.translateX(charizardTailTip.MOVE_MATRIX, 9.0);
    LIBS.translateY(charizardTailTip.MOVE_MATRIX, 1.2);
    LIBS.translateZ(charizardTailTip.MOVE_MATRIX, -5.2);

    LIBS.translateY(charizardTailTipFire.MOVE_MATRIX, 0.6);

    LIBS.translateX(charizardNeck.MOVE_MATRIX, 9.0);
    LIBS.translateY(charizardNeck.MOVE_MATRIX, 5.5);
    LIBS.translateZ(charizardNeck.MOVE_MATRIX, 0.4);
    LIBS.rotateX(charizardNeck.MOVE_MATRIX, LIBS.degToRad(10));

    LIBS.translateY(charizardHead.MOVE_MATRIX, 2.0);
    LIBS.translateZ(charizardHead.MOVE_MATRIX, 0.9);

    LIBS.translateY(charizardUpperMouth.MOVE_MATRIX, 15.1);
    LIBS.translateZ(charizardUpperMouth.MOVE_MATRIX, 3.8);
    LIBS.rotateX(charizardUpperMouth.MOVE_MATRIX, LIBS.degToRad(170));

    LIBS.translateY(charizardLowerMouth.MOVE_MATRIX, 13.45);
    LIBS.translateZ(charizardLowerMouth.MOVE_MATRIX, 6.05);
    LIBS.rotateX(charizardLowerMouth.MOVE_MATRIX, LIBS.degToRad(190));

    LIBS.translateY(charizardCheeks.MOVE_MATRIX, -0.4);
    LIBS.translateZ(charizardCheeks.MOVE_MATRIX, 0.2);

    LIBS.translateX(charizardUpperTeethLeft.MOVE_MATRIX, 0.4);
    LIBS.translateY(charizardUpperTeethLeft.MOVE_MATRIX, 10.8);
    LIBS.translateZ(charizardUpperTeethLeft.MOVE_MATRIX, -4.0);
    LIBS.rotateX(charizardUpperTeethLeft.MOVE_MATRIX, LIBS.degToRad(90));

    LIBS.translateX(charizardUpperTeethRight.MOVE_MATRIX, -0.4);
    LIBS.translateY(charizardUpperTeethRight.MOVE_MATRIX, 10.8);
    LIBS.translateZ(charizardUpperTeethRight.MOVE_MATRIX, -4.0);
    LIBS.rotateX(charizardUpperTeethRight.MOVE_MATRIX, LIBS.degToRad(90));

    LIBS.translateX(charizardLowerTeethLeft.MOVE_MATRIX, -0.2);
    LIBS.translateY(charizardLowerTeethLeft.MOVE_MATRIX, 3.25);
    LIBS.translateZ(charizardLowerTeethLeft.MOVE_MATRIX, 9.7);
    LIBS.rotateX(charizardLowerTeethLeft.MOVE_MATRIX, LIBS.degToRad(-90));

    LIBS.translateX(charizardLowerTeethRight.MOVE_MATRIX, 0.2);
    LIBS.translateY(charizardLowerTeethRight.MOVE_MATRIX, 3.25);
    LIBS.translateZ(charizardLowerTeethRight.MOVE_MATRIX, 9.7);
    LIBS.rotateX(charizardLowerTeethRight.MOVE_MATRIX, LIBS.degToRad(-90));

    LIBS.translateY(charizardTongue.MOVE_MATRIX, 0.25);
    LIBS.translateZ(charizardTongue.MOVE_MATRIX, -0.1);

    LIBS.translateX(charizardLeftEyelid.MOVE_MATRIX, 0.4);
    LIBS.translateY(charizardLeftEyelid.MOVE_MATRIX, 0.3);
    LIBS.translateZ(charizardLeftEyelid.MOVE_MATRIX, 0.4);

    LIBS.translateX(charizardRightEyelid.MOVE_MATRIX, -0.4);
    LIBS.translateY(charizardRightEyelid.MOVE_MATRIX, 0.3);
    LIBS.translateZ(charizardRightEyelid.MOVE_MATRIX, 0.4);

    LIBS.translateX(charizardLeftEyeWhite.MOVE_MATRIX, 0.1);
    LIBS.translateY(charizardLeftEyeWhite.MOVE_MATRIX, 0.3);
    LIBS.translateZ(charizardLeftEyeWhite.MOVE_MATRIX, -1.0);
    LIBS.rotateX(charizardLeftEyeWhite.MOVE_MATRIX, LIBS.degToRad(10));

    LIBS.translateX(charizardRightEyeWhite.MOVE_MATRIX, -0.1);
    LIBS.translateY(charizardRightEyeWhite.MOVE_MATRIX, 0.3);
    LIBS.translateZ(charizardRightEyeWhite.MOVE_MATRIX, -1.0);
    LIBS.rotateX(charizardRightEyeWhite.MOVE_MATRIX, LIBS.degToRad(10));

    LIBS.translateX(charizardLeftEyeBlack.MOVE_MATRIX, 0.2);
    LIBS.translateY(charizardLeftEyeBlack.MOVE_MATRIX, -0.05);
    LIBS.translateZ(charizardLeftEyeBlack.MOVE_MATRIX, 0.2);

    LIBS.translateX(charizardRightEyeBlack.MOVE_MATRIX, -0.2);
    LIBS.translateY(charizardRightEyeBlack.MOVE_MATRIX, -0.05);
    LIBS.translateZ(charizardRightEyeBlack.MOVE_MATRIX, 0.2);

    LIBS.translateX(charizardLeftHorn.MOVE_MATRIX, 0.7);
    LIBS.translateY(charizardLeftHorn.MOVE_MATRIX, 2.2);
    LIBS.translateZ(charizardLeftHorn.MOVE_MATRIX, -4.4);
    LIBS.rotateX(charizardLeftHorn.MOVE_MATRIX, LIBS.degToRad(20));

    LIBS.translateX(charizardRightHorn.MOVE_MATRIX, -0.7);
    LIBS.translateY(charizardRightHorn.MOVE_MATRIX, 2.2);
    LIBS.translateZ(charizardRightHorn.MOVE_MATRIX, -4.4);
    LIBS.rotateX(charizardRightHorn.MOVE_MATRIX, LIBS.degToRad(20));

    LIBS.translateX(charizardLeftWingMembrane.MOVE_MATRIX, 9.0);
    LIBS.translateY(charizardLeftWingMembrane.MOVE_MATRIX, 7.0 - 4.2);
    LIBS.translateZ(charizardLeftWingMembrane.MOVE_MATRIX, -1.71 + 0.6);
    LIBS.rotateY(charizardLeftWingMembrane.MOVE_MATRIX, LIBS.degToRad(-6));
    LIBS.rotateZ(charizardLeftWingMembrane.MOVE_MATRIX, LIBS.degToRad(30));

    LIBS.translateX(charizardRightWingMembrane.MOVE_MATRIX, 9.0);
    LIBS.translateY(charizardRightWingMembrane.MOVE_MATRIX, 7.0 - 4.2);
    LIBS.translateZ(charizardRightWingMembrane.MOVE_MATRIX, 0.4 - 1.5);
    LIBS.rotateY(charizardRightWingMembrane.MOVE_MATRIX, LIBS.degToRad(6));
    LIBS.rotateZ(charizardRightWingMembrane.MOVE_MATRIX, LIBS.degToRad(-30));

    LIBS.translateX(charizardLeftWingMembraneClose.MOVE_MATRIX, 9.0);
    LIBS.translateY(charizardLeftWingMembraneClose.MOVE_MATRIX, 7.0 - 4.2);
    LIBS.translateZ(charizardLeftWingMembraneClose.MOVE_MATRIX, -1.72 + 0.6);
    LIBS.rotateY(charizardLeftWingMembraneClose.MOVE_MATRIX, LIBS.degToRad(-6));
    LIBS.rotateZ(charizardLeftWingMembraneClose.MOVE_MATRIX, LIBS.degToRad(30));

    LIBS.translateX(charizardRightWingMembraneClose.MOVE_MATRIX, 9.0);
    LIBS.translateY(charizardRightWingMembraneClose.MOVE_MATRIX, 7.0 - 4.2);
    LIBS.translateZ(charizardRightWingMembraneClose.MOVE_MATRIX, 0.37 - 1.5);
    LIBS.rotateY(charizardRightWingMembraneClose.MOVE_MATRIX, LIBS.degToRad(6));
    LIBS.rotateZ(charizardRightWingMembraneClose.MOVE_MATRIX, LIBS.degToRad(-30));
    // CHARIZARD TRANSFORMATION END

    // ENVIRONMENT HIERARCHY
    cloudbase1.addChild(cloud1);
    cloudbase2.addChild(cloud2);
    cloudbase3.addChild(cloud3);
    // ENVIRONMENT HIERARCHY END

    // CHARMANDER HIERARCHY
    charmanderBody.addChild(charmanderBelly);

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
    charmanderLeftEye.addChild(charmanderLeftEyePupil2);

    charmanderRightEye.addChild(charmanderRightEyePupil);
    charmanderRightEye.addChild(charmanderRightEyePupil2);

    charmanderLeftarmShoulder.addChild(charmanderLeftArm);

    charmanderRightarmShoulder.addChild(charmanderRightArm);

    charmanderLeftLeg.addChild(charmanderLeftLegAnkle);

    charmanderRightLeg.addChild(charmanderRightLegAnkle);

    charmanderLeftLegAnkle.addChild(charmanderLeftLegFoot);
    charmanderLeftLegAnkle.addChild(charmanderLeftLegClaw1);
    charmanderLeftLegAnkle.addChild(charmanderLeftLegClaw2);
    charmanderLeftLegAnkle.addChild(charmanderLeftLegClaw3);

    charmanderRightLegAnkle.addChild(charmanderRightLegFoot);
    charmanderRightLegAnkle.addChild(charmanderRightLegClaw1);
    charmanderRightLegAnkle.addChild(charmanderRightLegClaw2);
    charmanderRightLegAnkle.addChild(charmanderRightLegClaw3);
    // CHARMANDER HIERARCHY END

    // CHARMELEON HIERARCHY
    // ...
    // CHARMELEON HIERARCHY END

    // CHARIZARD HIERARCHY
    charizardBody.addChild(charizardBelly);

    charizardNeck.addChild(charizardHead);

    charizardHead.addChild(charizardUpperMouth);
    charizardHead.addChild(charizardLowerMouth);
    charizardHead.addChild(charizardCheeks);
    charizardHead.addChild(charizardLeftEyelid);
    charizardHead.addChild(charizardRightEyelid);
    charizardHead.addChild(charizardLeftHorn);
    charizardHead.addChild(charizardRightHorn);

    charizardLeftEyelid.addChild(charizardLeftEyeWhite);

    charizardRightEyelid.addChild(charizardRightEyeWhite);

    charizardLeftEyeWhite.addChild(charizardLeftEyeBlack);

    charizardRightEyeWhite.addChild(charizardRightEyeBlack);

    charizardUpperMouth.addChild(charizardUpperTeethLeft);
    charizardUpperMouth.addChild(charizardUpperTeethRight);

    charizardLowerMouth.addChild(charizardLowerTeethLeft);
    charizardLowerMouth.addChild(charizardLowerTeethRight);
    charizardLowerMouth.addChild(charizardTongue);

    charizardTailTip.addChild(charizardTailTipFire);

    charizardLeftShoulder.addChild(charizardLeftArm);

    charizardRightShoulder.addChild(charizardRightArm);

    charizardLeftArm.addChild(charizardLeftHandPalm);

    charizardRightArm.addChild(charizardRightHandPalm);

    charizardLeftThigh.addChild(charizardLeftLeg);

    charizardRightThigh.addChild(charizardRightLeg);

    charizardLeftLeg.addChild(charizardLeftFoot);

    charizardRightLeg.addChild(charizardRightFoot);

    charizardLeftFoot.addChild(charizardLeftFootClaw1);
    charizardLeftFoot.addChild(charizardLeftFootClaw2);
    charizardLeftFoot.addChild(charizardLeftFootClaw3);

    charizardRightFoot.addChild(charizardRightFootClaw1);
    charizardRightFoot.addChild(charizardRightFootClaw2);
    charizardRightFoot.addChild(charizardRightFootClaw3);
    // CHARIZARD HIERARCHY END

    // ENVIRONMENT SETUP OBJECT
    base.setup();

    treeLog1.setup();
    treeLog2.setup();

    treeLeaves1.setup();
    treeLeaves2.setup();
    treeLeaves3.setup();
    treeLeaves4.setup();
    treeLeaves5.setup();
    treeLeaves6.setup();
    treeLeaves7.setup();
    treeLeaves8.setup();
    treeLeaves9.setup();
    treeLeaves10.setup();
    treeLeaves11.setup();
    treeLeaves12.setup();

    cloudbase1.setup();
    cloudbase2.setup();
    cloudbase3.setup();

    rocks.forEach(rock => rock.setup());

    rockWaterfall.setup();

    waterRock.setup();

    waterfall.setup();

    grasses.forEach(grass => grass.setup());
    // ENVIRONMENT SETUP OBJECT END

    // CHARMANDER SETUP OBJECT
    charmanderBody.setup();
    charmanderHead.setup();
    charmanderTail.setup();
    charmanderLeftarmShoulder.setup();
    charmanderRightarmShoulder.setup();
    charmanderLeftLeg.setup();
    charmanderRightLeg.setup();
    // CHARMANDER SETUP OBJECT END

    // CHARMELEON SETUP OBJECT
    // ...
    // CHARMELEON SETUP OBJECT END

    // CHARIZARD SETUP OBJECT
    charizardBody.setup();
    charizardLeftThigh.setup();
    charizardRightThigh.setup();
    charizardLeftShoulder.setup();
    charizardRightShoulder.setup();
    charizardTail.setup();
    charizardTailTip.setup();
    charizardNeck.setup();
    charizardLeftWingMembrane.setup();
    charizardLeftWingMembraneClose.setup();
    charizardRightWingMembrane.setup();
    charizardRightWingMembraneClose.setup();
    // CHARIZARD SETUP OBJECT END

    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.clearColor(0.5, 0.7, 0.9, 1.0);
    GL.clearDepth(1.0);

    const allTreeLeaves = [
        treeLeaves1, treeLeaves2, treeLeaves3, treeLeaves4,
        treeLeaves5, treeLeaves6, treeLeaves7, treeLeaves8,
        treeLeaves9, treeLeaves10, treeLeaves11, treeLeaves12
    ];
    const initialTreeLeavesMatrices = allTreeLeaves.map(leaf => [...leaf.MOVE_MATRIX]);

    var cloudCurrentTranslateX = 0;
    var cloudTranslateXDirection = 1;
    var cloudCurrentTranslateY = 0;
    var cloudTranslateYDirection = 1;

    var charizardCurrentFlap = 0;
    var charizardFlapDirection = 1;
    var charizardCurrentTranslate = 0;
    var charizardTranslateDirection = 1;

    var animate = function (time) {
        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        // GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        if (!drag) {
            dX *= (1 - FRICTION);
            dY *= (1 - FRICTION);
            THETA += dX;
            PHI += dY;
        }

        var MODELMATRIX = LIBS.get_I4();
        var VIEWMATRIX_dynamic = LIBS.get_I4();

        LIBS.translateZ(VIEWMATRIX_dynamic, zoom);
        LIBS.rotateY(VIEWMATRIX_dynamic, THETA);
        LIBS.rotateX(VIEWMATRIX_dynamic, PHI);

        LIBS.multiply(VIEWMATRIX_dynamic, VIEWMATRIX, VIEWMATRIX_dynamic);

        GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX_dynamic);
        GL.uniformMatrix4fv(_Mmatrix, false, MODELMATRIX);

        // ENVIRONMENT RENDER OBJECT
        base.render(MODELMATRIX);
        treeLog1.render(MODELMATRIX);
        treeLog2.render(MODELMATRIX);
        treeLeaves1.render(MODELMATRIX);
        treeLeaves2.render(MODELMATRIX);
        treeLeaves3.render(MODELMATRIX);
        treeLeaves4.render(MODELMATRIX);
        treeLeaves5.render(MODELMATRIX);
        treeLeaves6.render(MODELMATRIX);
        treeLeaves7.render(MODELMATRIX);
        treeLeaves8.render(MODELMATRIX);
        treeLeaves9.render(MODELMATRIX);
        treeLeaves10.render(MODELMATRIX);
        treeLeaves11.render(MODELMATRIX);
        treeLeaves12.render(MODELMATRIX);
        cloudbase1.render(MODELMATRIX);
        cloudbase2.render(MODELMATRIX);
        cloudbase3.render(MODELMATRIX);
        rocks.forEach(rock => rock.render(MODELMATRIX));
        rockWaterfall.render(MODELMATRIX);
        waterRock.render(MODELMATRIX);
        waterfall.render(MODELMATRIX);
        grasses.forEach(grass => grass.render(MODELMATRIX));
        // ENVIRONMENT RENDER OBJECT END

        // CHARMANDER RENDER OBJECT
        charmanderBody.render(MODELMATRIX);
        charmanderHead.render(MODELMATRIX);
        charmanderTail.render(MODELMATRIX);
        charmanderLeftarmShoulder.render(MODELMATRIX);
        charmanderRightarmShoulder.render(MODELMATRIX);
        charmanderLeftLeg.render(MODELMATRIX);
        charmanderRightLeg.render(MODELMATRIX);
        // CHARMANDER RENDER OBJECT END

        // CHARMELEON RENDER OBJECT
        // ...
        // CHARMELEON RENDER OBJECT END

        // CHARIZARD RENDER OBJECT
        charizardBody.render(MODELMATRIX);
        charizardLeftThigh.render(MODELMATRIX);
        charizardRightThigh.render(MODELMATRIX);
        charizardLeftShoulder.render(MODELMATRIX);
        charizardRightShoulder.render(MODELMATRIX);
        charizardTail.render(MODELMATRIX);
        charizardTailTip.render(MODELMATRIX);
        charizardNeck.render(MODELMATRIX);
        charizardLeftWingMembrane.render(MODELMATRIX);
        charizardLeftWingMembraneClose.render(MODELMATRIX);
        charizardRightWingMembrane.render(MODELMATRIX);
        charizardRightWingMembraneClose.render(MODELMATRIX);
        // CHARIZARD RENDER OBJECT END

        // ENVIRONMENT ANIMATION
        allTreeLeaves.forEach((leaf, index) => {
            const leavesScale = 1.0 + Math.sin((time / 500) + index) * 0.05;
            leaf.MOVE_MATRIX = [...initialTreeLeavesMatrices[index]];
            LIBS.scaleX(leaf.MOVE_MATRIX, leavesScale);
            LIBS.scaleY(leaf.MOVE_MATRIX, leavesScale);
            LIBS.scaleZ(leaf.MOVE_MATRIX, leavesScale);
        });

        cloudCurrentTranslateX += cloudTranslateXDirection * 0.001;
        cloudCurrentTranslateY += cloudTranslateYDirection * 0.001;

        if (cloudCurrentTranslateX >= 0.08) {
            cloudTranslateXDirection = -1;
        } else if (cloudCurrentTranslateX <= -0.08) {
            cloudTranslateXDirection = 1;
        }

        if (cloudCurrentTranslateY >= 0.03) {
            cloudTranslateYDirection = -1;
        } else if (cloudCurrentTranslateY <= -0.03) {
            cloudTranslateYDirection = 1;
        }

        LIBS.translateX(cloudbase1.MOVE_MATRIX, cloudCurrentTranslateX);
        LIBS.translateY(cloudbase1.MOVE_MATRIX, cloudCurrentTranslateY);

        LIBS.translateX(cloudbase2.MOVE_MATRIX, cloudCurrentTranslateX);
        LIBS.translateY(cloudbase2.MOVE_MATRIX, -cloudCurrentTranslateY);

        LIBS.translateX(cloudbase3.MOVE_MATRIX, cloudCurrentTranslateX);
        LIBS.translateY(cloudbase3.MOVE_MATRIX, cloudCurrentTranslateY);

        const waterfallScale = 1.0 + Math.sin((time / 300)) * 0.003;
        LIBS.scaleX(waterfall.MOVE_MATRIX, waterfallScale);
        // ENVIRONMENT ANIMATION END

        // CHARMANDER ANIMATION
        // ...
        // CHARMANDER ANIMATION END

        // CHARMELEON ANIMATION
        // ...
        // CHARMELEON ANIMATION END

        // CHARIZARD ANIMATION
        charizardCurrentFlap += charizardFlapDirection * 0.001;
        charizardCurrentTranslate += charizardTranslateDirection * 0.001;

        if (charizardCurrentFlap >= 0.02) {
            charizardFlapDirection = -1;
        } else if (charizardCurrentFlap <= -0.02) {
            charizardFlapDirection = 1;
        }

        if (charizardCurrentTranslate >= 0.05) {
            charizardTranslateDirection = -1;
        } else if (charizardCurrentTranslate <= -0.05) {
            charizardTranslateDirection = 1;
        }

        LIBS.rotateY(charizardLeftWingMembrane.MOVE_MATRIX, charizardCurrentFlap);
        LIBS.rotateY(charizardRightWingMembrane.MOVE_MATRIX, -charizardCurrentFlap);
        LIBS.rotateY(charizardLeftWingMembraneClose.MOVE_MATRIX, charizardCurrentFlap);
        LIBS.rotateY(charizardRightWingMembraneClose.MOVE_MATRIX, -charizardCurrentFlap);

        LIBS.translateY(charizardBody.MOVE_MATRIX, charizardCurrentTranslate);
        LIBS.translateZ(charizardBelly.MOVE_MATRIX, charizardCurrentTranslate * -0.05);
        LIBS.translateY(charizardLeftThigh.MOVE_MATRIX, charizardCurrentTranslate);
        LIBS.translateY(charizardRightThigh.MOVE_MATRIX, charizardCurrentTranslate);
        LIBS.translateY(charizardLeftFootClaw1.MOVE_MATRIX, charizardCurrentTranslate * 2.0);
        LIBS.translateY(charizardLeftFootClaw2.MOVE_MATRIX, charizardCurrentTranslate * 2.0);
        LIBS.translateY(charizardLeftFootClaw3.MOVE_MATRIX, charizardCurrentTranslate * 2.0);
        LIBS.translateY(charizardRightFootClaw1.MOVE_MATRIX, charizardCurrentTranslate * 2.0);
        LIBS.translateY(charizardRightFootClaw2.MOVE_MATRIX, charizardCurrentTranslate * 2.0);
        LIBS.translateY(charizardRightFootClaw3.MOVE_MATRIX, charizardCurrentTranslate * 2.0);
        LIBS.translateY(charizardLeftShoulder.MOVE_MATRIX, charizardCurrentTranslate);
        LIBS.translateY(charizardRightShoulder.MOVE_MATRIX, charizardCurrentTranslate);
        LIBS.translateX(charizardLeftArm.MOVE_MATRIX, charizardCurrentTranslate);
        LIBS.translateY(charizardLeftArm.MOVE_MATRIX, charizardCurrentTranslate);
        LIBS.translateX(charizardRightArm.MOVE_MATRIX, -charizardCurrentTranslate);
        LIBS.translateY(charizardRightArm.MOVE_MATRIX, charizardCurrentTranslate);
        LIBS.translateY(charizardTail.MOVE_MATRIX, charizardCurrentTranslate);
        LIBS.translateY(charizardTailTip.MOVE_MATRIX, charizardCurrentTranslate * 1.0);
        LIBS.translateY(charizardLeftWingMembrane.MOVE_MATRIX, charizardCurrentTranslate);
        LIBS.translateY(charizardRightWingMembrane.MOVE_MATRIX, charizardCurrentTranslate);
        LIBS.translateY(charizardLeftWingMembraneClose.MOVE_MATRIX, charizardCurrentTranslate);
        LIBS.translateY(charizardRightWingMembraneClose.MOVE_MATRIX, charizardCurrentTranslate);
        LIBS.translateY(charizardNeck.MOVE_MATRIX, charizardCurrentTranslate);
        LIBS.translateY(charizardUpperMouth.MOVE_MATRIX, charizardCurrentTranslate * 2.0);
        LIBS.translateY(charizardLowerMouth.MOVE_MATRIX, charizardCurrentTranslate * 2.0);
        LIBS.translateZ(charizardUpperMouth.MOVE_MATRIX, charizardCurrentTranslate * -0.2);
        LIBS.translateZ(charizardLowerMouth.MOVE_MATRIX, charizardCurrentTranslate * 0.2);
        LIBS.translateZ(charizardLeftEyeWhite.MOVE_MATRIX, charizardCurrentTranslate * -0.2);
        LIBS.translateZ(charizardRightEyeWhite.MOVE_MATRIX, charizardCurrentTranslate * -0.2);
        LIBS.translateZ(charizardLeftHorn.MOVE_MATRIX, charizardCurrentTranslate * -0.2);
        LIBS.translateZ(charizardRightHorn.MOVE_MATRIX, charizardCurrentTranslate * -0.2);
        LIBS.translateY(charizardUpperTeethLeft.MOVE_MATRIX, charizardCurrentTranslate * 1.0);
        LIBS.translateY(charizardUpperTeethRight.MOVE_MATRIX, charizardCurrentTranslate * 1.0);
        LIBS.translateZ(charizardUpperTeethLeft.MOVE_MATRIX, charizardCurrentTranslate * -1.0);
        LIBS.translateZ(charizardUpperTeethRight.MOVE_MATRIX, charizardCurrentTranslate * -1.0);
        LIBS.translateY(charizardLowerTeethLeft.MOVE_MATRIX, charizardCurrentTranslate * 1.0);
        LIBS.translateY(charizardLowerTeethRight.MOVE_MATRIX, charizardCurrentTranslate * 1.0);
        LIBS.translateZ(charizardLowerTeethLeft.MOVE_MATRIX, charizardCurrentTranslate * 1.0);
        LIBS.translateZ(charizardLowerTeethRight.MOVE_MATRIX, charizardCurrentTranslate * 1.0);
        LIBS.translateZ(charizardLeftFoot.MOVE_MATRIX, charizardCurrentTranslate * -0.3);
        LIBS.translateZ(charizardRightFoot.MOVE_MATRIX, charizardCurrentTranslate * -0.3);
        LIBS.translateY(charizardLeftFootClaw1.MOVE_MATRIX, charizardCurrentTranslate * -0.07);
        LIBS.translateY(charizardLeftFootClaw2.MOVE_MATRIX, charizardCurrentTranslate * -0.07);
        LIBS.translateY(charizardLeftFootClaw3.MOVE_MATRIX, charizardCurrentTranslate * -0.07);
        LIBS.translateY(charizardRightFootClaw1.MOVE_MATRIX, charizardCurrentTranslate * -0.07);
        LIBS.translateY(charizardRightFootClaw2.MOVE_MATRIX, charizardCurrentTranslate * -0.07);
        LIBS.translateY(charizardRightFootClaw3.MOVE_MATRIX, charizardCurrentTranslate * -0.07);
        LIBS.translateZ(charizardLeftFootClaw1.MOVE_MATRIX, charizardCurrentTranslate * -0.07);
        LIBS.translateZ(charizardLeftFootClaw2.MOVE_MATRIX, charizardCurrentTranslate * -0.07);
        LIBS.translateZ(charizardLeftFootClaw3.MOVE_MATRIX, charizardCurrentTranslate * -0.07);
        LIBS.translateZ(charizardRightFootClaw1.MOVE_MATRIX, charizardCurrentTranslate * -0.07);
        LIBS.translateZ(charizardRightFootClaw2.MOVE_MATRIX, charizardCurrentTranslate * -0.07);
        LIBS.translateZ(charizardRightFootClaw3.MOVE_MATRIX, charizardCurrentTranslate * -0.07);

        const tailTipScale = 1.0 + Math.sin((time / 100) + Math.PI) * 0.02;

        LIBS.scaleX(charizardTailTip.MOVE_MATRIX, tailTipScale);
        LIBS.scaleY(charizardTailTip.MOVE_MATRIX, tailTipScale);
        LIBS.scaleZ(charizardTailTip.MOVE_MATRIX, tailTipScale);
        // CHARIZARD ANIMATION END

        GL.flush();
        window.requestAnimationFrame(animate);
    }
    animate(0);
}

window.addEventListener('load', main);