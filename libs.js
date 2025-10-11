var LIBS = {
    degToRad: function (angle) {
        return (angle * Math.PI / 180);
    },


    get_projection: function (angle, a, zMin, zMax) {
        var tan = Math.tan(LIBS.degToRad(0.5 * angle)),
            A = -(zMax + zMin) / (zMax - zMin),
            B = (-2 * zMax * zMin) / (zMax - zMin);


        return [
            0.5 / tan, 0, 0, 0,
            0, 0.5 * a / tan, 0, 0,
            0, 0, A, -1,
            0, 0, B, 0
        ];
    },


    get_I4: function () {
        return [1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1];
    },


    set_I4: function (m) {
        m[0] = 1, m[1] = 0, m[2] = 0, m[3] = 0,
            m[4] = 0, m[5] = 1, m[6] = 0, m[7] = 0,
            m[8] = 0, m[9] = 0, m[10] = 1, m[11] = 0,
            m[12] = 0, m[13] = 0, m[14] = 0, m[15] = 1;
    },


    rotateX: function (m, angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var mv1 = m[1], mv5 = m[5], mv9 = m[9];
        m[1] = m[1] * c - m[2] * s;
        m[5] = m[5] * c - m[6] * s;
        m[9] = m[9] * c - m[10] * s;


        m[2] = m[2] * c + mv1 * s;
        m[6] = m[6] * c + mv5 * s;
        m[10] = m[10] * c + mv9 * s;
    },


    rotateY: function (m, angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var mv0 = m[0], mv4 = m[4], mv8 = m[8];
        m[0] = c * m[0] + s * m[2];
        m[4] = c * m[4] + s * m[6];
        m[8] = c * m[8] + s * m[10];


        m[2] = c * m[2] - s * mv0;
        m[6] = c * m[6] - s * mv4;
        m[10] = c * m[10] - s * mv8;
    },


    rotateZ: function (m, angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var mv0 = m[0], mv4 = m[4], mv8 = m[8];
        m[0] = c * m[0] - s * m[1];
        m[4] = c * m[4] - s * m[5];
        m[8] = c * m[8] - s * m[9];


        m[1] = c * m[1] + s * mv0;
        m[5] = c * m[5] + s * mv4;
        m[9] = c * m[9] + s * mv8;
    },


    translateZ: function (m, t) {
        m[14] += t;
    },
    translateX: function (m, t) {
        m[12] += t;
    },
    translateY: function (m, t) {
        m[13] += t;
    },


    set_position: function (m, x, y, z) {
        m[12] = x, m[13] = y, m[14] = z;
    },

    scaleX: function (m, t) {
        m[0] *= t;
    },

    scaleY: function (m, t) {
        m[5] *= t;
    },

    scaleZ: function (m, t) {
        m[10] *= t;
    },

    multiply: function (m1, m2) {
        var rm = this.get_I4();
        var N = 4;
        for (var i = 0; i < N; i++) {
            for (var j = 0; j < N; j++) {
                rm[i * N + j] = 0;
                for (var k = 0; k < N; k++)
                    rm[i * N + j] += m1[i * N + k] * m2[k * N + j];
            }
        }
        return rm;
    },

    rotateArbitraryAxis: function (m, axis, angle) {
        const [x, y, z] = axis;
        const len = Math.sqrt(x * x + y * y + z * z);
        if (len === 0) return;
        const nx = x / len, ny = y / len, nz = z / len;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const t = 1 - c;

        // Matriks rotasi 4x4
        const rot = [
            t * nx * nx + c, t * nx * ny - s * nz, t * nx * nz + s * ny, 0,
            t * nx * ny + s * nz, t * ny * ny + c, t * ny * nz - s * nx, 0,
            t * nx * nz - s * ny, t * ny * nz + s * nx, t * nz * nz + c, 0,
            0, 0, 0, 1
        ];

        // Kalikan matrix dengan rotasi (in-place)
        const result = LIBS.multiply(m, rot);
        for (let i = 0; i < 16; i++) m[i] = result[i];
    },

    axisNormalize: function (v) {
        const len = Math.hypot(v[0], v[1], v[2]);
        if (len === 0) return [0, 1, 0]; // fallback axis
        return [v[0] / len, v[1] / len, v[2] / len];
    }
};