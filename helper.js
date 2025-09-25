function generateEllipsoid(rx = 1, ry = 1, rz = 1, stacks = 20, slices = 20, color = [1.0, 1.0, 1.0]) {
    let vertices = [];
    let indices = [];

    const rCol = color[0] ?? 1.0;
    const gCol = color[1] ?? 1.0;
    const bCol = color[2] ?? 1.0;

    // Generate vertices (posisi + warna tetap)
    for (let i = 0; i <= stacks; i++) {
        let theta = i * Math.PI / stacks; // 0 -> PI
        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);

        for (let j = 0; j <= slices; j++) {
            let phi = j * 2 * Math.PI / slices; // 0 -> 2PI
            let sinPhi = Math.sin(phi);
            let cosPhi = Math.cos(phi);

            // posisi
            let x = rx * sinTheta * cosPhi;
            let y = ry * cosTheta;
            let z = rz * sinTheta * sinPhi;

            // push posisi + warna custom
            vertices.push(x, y, z, rCol, gCol, bCol);
        }
    }

    // Generate indices
    for (let i = 0; i < stacks; i++) {
        for (let j = 0; j < slices; j++) {
            let first = i * (slices + 1) + j;
            let second = first + slices + 1;

            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices)
    };
}

function generateEllipsoidGradient(rx = 1, ry = 1, rz = 1, stacks = 20, slices = 20, colorTop = [1.0, 0.0, 0.0], colorBottom = [0.0, 0.0, 1.0]) {
    let vertices = [];
    let indices = [];

    // Generate vertices (posisi + warna gradient)
    for (let i = 0; i <= stacks; i++) {
        let theta = i * Math.PI / stacks; // 0 -> PI
        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);

        // progress untuk gradient (0 = atas, 1 = bawah)
        let t = i / stacks;

        // Interpolasi warna (linear)
        let rCol = colorTop[0] * (1 - t) + colorBottom[0] * t;
        let gCol = colorTop[1] * (1 - t) + colorBottom[1] * t;
        let bCol = colorTop[2] * (1 - t) + colorBottom[2] * t;

        for (let j = 0; j <= slices; j++) {
            let phi = j * 2 * Math.PI / slices; // 0 -> 2PI
            let sinPhi = Math.sin(phi);
            let cosPhi = Math.cos(phi);

            // posisi ellipsoid
            let x = rx * sinTheta * cosPhi;
            let y = ry * cosTheta;
            let z = rz * sinTheta * sinPhi;

            // push posisi + warna hasil interpolasi
            vertices.push(x, y, z, rCol, gCol, bCol);
        }
    }

    // Generate indices (quad → 2 segitiga)
    for (let i = 0; i < stacks; i++) {
        for (let j = 0; j < slices; j++) {
            let first = i * (slices + 1) + j;
            let second = first + slices + 1;

            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices)
    };
}

function generateCurvedCylinder(radiusStart = 0.2, radiusEnd = 0.1, length = 2.0, segments = 20, rings = 10, color = [1.0, 1.0, 1.0]) {
    let vertices = [];
    let indices = [];

    for (let i = 0; i <= segments; i++) {
        let t = i / segments;
        let r = radiusStart * (1 - t) + radiusEnd * t;  // radius mengecil ke ujung
        let y = -Math.sin(t * Math.PI / 2) * length;    // sedikit lengkung ke atas
        let z = -Math.cos(t * Math.PI / 2) * length;    // mundur ke belakang

        for (let j = 0; j <= rings; j++) {
            let theta = (j / rings) * 2 * Math.PI;
            let x = r * Math.cos(theta);
            let zOffset = r * Math.sin(theta);
            vertices.push(x, y, z + zOffset, ...color);
        }
    }

    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < rings; j++) {
            let a = i * (rings + 1) + j;
            let b = a + rings + 1;
            let c = b + 1;
            let d = a + 1;
            // dua segitiga per face quad
            indices.push(a, b, d);
            indices.push(b, c, d);
        }
    }

    return { vertices, indices };
}

function generateCylinderDynamicRadius(minStart, maxStart, minEnd, maxEnd, height, radialSegments, heightSegments, color, mode = "linear") {
    let vertices = [];
    let indices = [];

    for (let y = 0; y <= heightSegments; y++) {
        let v = y / heightSegments;
        let currY = v * height - height / 2; // dari -h/2 ke +h/2

        // radius bawah & atas (masing-masing punya min dan max)
        let minR = minStart + (minEnd - minStart) * v;
        let maxR = maxStart + (maxEnd - maxStart) * v;

        // pilih fungsi interpolasi
        let t;
        if (mode === "linear") {
            t = v; // lurus saja
        } else if (mode === "sin") {
            t = Math.sin(v * Math.PI); // naik turun (gendut di tengah)
        } else if (mode === "cos") {
            t = (1 - Math.cos(v * Math.PI)) / 2; // smooth naik (S-curve)
        } else {
            t = v; // fallback linear
        }

        // radius final
        let currRadius = minR * (1 - t) + maxR * t;

        // bikin ring
        for (let i = 0; i <= radialSegments; i++) {
            let u = i / radialSegments;
            let theta = u * 2 * Math.PI;

            let x = Math.cos(theta) * currRadius;
            let z = Math.sin(theta) * currRadius;

            vertices.push(x, currY, z, color[0], color[1], color[2]);
        }
    }

    // bikin face (dua segitiga per quad)
    for (let y = 0; y < heightSegments; y++) {
        for (let i = 0; i < radialSegments; i++) {
            let row1 = y * (radialSegments + 1);
            let row2 = (y + 1) * (radialSegments + 1);

            indices.push(row1 + i, row2 + i, row1 + i + 1);
            indices.push(row1 + i + 1, row2 + i, row2 + i + 1);
        }
    }

    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices)
    };
}

function generateBlanket(radiusX, radiusY, height, segmentsX, segmentsY, color, thickness = 0.1) {
    let vertices = [];
    let indices = [];

    // ====== FRONT SURFACE ======
    for (let j = 0; j <= segmentsY; j++) {
        let v = j / segmentsY;
        let y = (v - 0.5) * height;

        for (let i = 0; i <= segmentsX; i++) {
            let u = i / segmentsX;
            let angle = (u - 0.5) * Math.PI;

            let x = Math.cos(angle) * radiusX;
            let z = Math.sin(angle) * radiusY;

            // permukaan depan
            vertices.push(x, y, z + thickness / 2, color[0], color[1], color[2]);
        }
    }

    // ====== BACK SURFACE ======
    for (let j = 0; j <= segmentsY; j++) {
        let v = j / segmentsY;
        let y = (v - 0.5) * height;

        for (let i = 0; i <= segmentsX; i++) {
            let u = i / segmentsX;
            let angle = (u - 0.5) * Math.PI;

            let x = Math.cos(angle) * radiusX;
            let z = Math.sin(angle) * radiusY;

            // permukaan belakang
            vertices.push(x, y, z - thickness / 2, color[0], color[1], color[2]);
        }
    }

    // ====== INDICES FRONT ======
    for (let j = 0; j < segmentsY; j++) {
        for (let i = 0; i < segmentsX; i++) {
            let row1 = j * (segmentsX + 1);
            let row2 = (j + 1) * (segmentsX + 1);

            indices.push(row1 + i, row2 + i, row1 + i + 1);
            indices.push(row1 + i + 1, row2 + i, row2 + i + 1);
        }
    }

    // ====== INDICES BACK ======
    let offset = (segmentsY + 1) * (segmentsX + 1);
    for (let j = 0; j < segmentsY; j++) {
        for (let i = 0; i < segmentsX; i++) {
            let row1 = j * (segmentsX + 1) + offset;
            let row2 = (j + 1) * (segmentsX + 1) + offset;

            // urutan dibalik supaya normalnya ke dalam
            indices.push(row1 + i, row1 + i + 1, row2 + i);
            indices.push(row1 + i + 1, row2 + i + 1, row2 + i);
        }
    }

    // ====== SIDE WALLS ======
    for (let j = 0; j < segmentsY; j++) {
        for (let i = 0; i <= segmentsX; i++) {
            let frontA = j * (segmentsX + 1) + i;
            let frontB = (j + 1) * (segmentsX + 1) + i;
            let backA = frontA + offset;
            let backB = frontB + offset;

            indices.push(frontA, backA, frontB);
            indices.push(frontB, backA, backB);
        }
    }

    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices)
    };
}

function generateCylinder(radiusTop, radiusBottom, height, radialSegments, heightSegments, color) {
    let vertices = [];
    let indices = [];

    for (let y = 0; y <= heightSegments; y++) {
        let v = y / heightSegments;
        let currRadius = radiusBottom + (radiusTop - radiusBottom) * (v); // interpolasi radius
        let currY = v * height - height / 2; // dari -h/2 ke +h/2

        for (let i = 0; i <= radialSegments; i++) {
            let u = i / radialSegments;
            let theta = u * 2 * Math.PI;

            let x = Math.cos(theta) * currRadius;
            let z = Math.sin(theta) * currRadius;

            vertices.push(x, currY, z, color[0], color[1], color[2]);
        }
    }

    // buat index untuk segitiga
    for (let y = 0; y < heightSegments; y++) {
        for (let i = 0; i < radialSegments; i++) {
            let row1 = y * (radialSegments + 1);
            let row2 = (y + 1) * (radialSegments + 1);

            indices.push(row1 + i, row2 + i, row1 + i + 1);
            indices.push(row1 + i + 1, row2 + i, row2 + i + 1);
        }
    }

    return { vertices, indices };
}

function generateEllipticParaboloid(a = 1.0, b = 1.0, height = 2.0, radialSegments = 32, heightSegments = 32, color = [1.0, 1.0, 1.0]) {
    let vertices = [];
    let indices = [];

    for (let i = 0; i <= heightSegments; i++) {
        let t = i / heightSegments;       // 0 → 1
        let r = Math.sqrt(t);             // radius mengecil ke bawah, melebar ke atas
        let z = height * t;

        for (let j = 0; j <= radialSegments; j++) {
            let theta = (j / radialSegments) * 2 * Math.PI;
            let x = a * r * Math.cos(theta);
            let y = b * r * Math.sin(theta);
            vertices.push(x, y, z, ...color);
        }
    }

    for (let i = 0; i < heightSegments; i++) {
        for (let j = 0; j < radialSegments; j++) {
            let a1 = i * (radialSegments + 1) + j;
            let b1 = a1 + radialSegments + 1;
            let c1 = b1 + 1;
            let d1 = a1 + 1;

            indices.push(a1, b1, d1);
            indices.push(b1, c1, d1);
        }
    }

    return { vertices, indices };
}

function generateHyperboloid(a = 1.0, b = 1.0, c = 1.0, vMax = 1.0, radialSegments = 32, heightSegments = 32, color = [1.0, 0.0, 0.0]) {
    let vertices = [];
    let indices = [];

    for (let i = 0; i <= heightSegments; i++) {
        let v = (i / heightSegments) * (2 * vMax) - vMax; // -vMax → +vMax
        let z = c * Math.sinh(v);                        // tinggi (cekung ke dalam)

        let coshV = Math.cosh(v);

        for (let j = 0; j <= radialSegments; j++) {
            let u = (j / radialSegments) * 2 * Math.PI;

            let x = a * coshV * Math.cos(u);
            let y = b * coshV * Math.sin(u);

            vertices.push(x, y, z, ...color);
        }
    }

    // bikin index (seperti cylinder)
    for (let i = 0; i < heightSegments; i++) {
        for (let j = 0; j < radialSegments; j++) {
            let a1 = i * (radialSegments + 1) + j;
            let b1 = a1 + radialSegments + 1;
            let c1 = b1 + 1;
            let d1 = a1 + 1;

            indices.push(a1, b1, d1);
            indices.push(b1, c1, d1);
        }
    }

    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices)
    };
}

function generateEllipticArc3D(a = 1.0, b = 0.3, c = 0.2, segments = 50, color = [1.0, 0.0, 0.0]) {
    let vertices = [];
    let indices = [];

    for (let i = 0; i <= segments; i++) {
        let t = (i / segments) * Math.PI; // 0 → π (arc setengah elips)
        let x = a * Math.cos(t);
        let y = b * Math.sin(t);
        let z = c * Math.sin(t / 2); // melengkung ke dalam

        // push posisi + warna (biar sama formatnya dengan yang lain)
        vertices.push(x, y, z, color[0], color[1], color[2]);
    }

    // Tidak ada face, jadi indices kosong
    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array([])
    };
}

