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

function generateBlanket(radiusX, radiusY, height, segmentsX, segmentsY, color) {
    let vertices = [];
    let indices = [];

    // Parametrik: u (sumbu X) untuk lebar perut, v (sumbu Y) untuk tinggi
    for (let j = 0; j <= segmentsY; j++) {
        let v = j / segmentsY;
        let y = (v - 0.5) * height; // dari -h/2 ke h/2

        for (let i = 0; i <= segmentsX; i++) {
            let u = i / segmentsX;
            let angle = (u - 0.5) * Math.PI; // dari -90° sampai +90°

            // Posisi di permukaan "selimut" melengkung
            let x = Math.cos(angle) * radiusX;
            let z = Math.sin(angle) * radiusY; // melengkung ke depan

            // Push vertex (x, y, z) + warna
            vertices.push(x, y, z, color[0], color[1], color[2]);
        }
    }

    // Indeks quad -> segitiga
    for (let j = 0; j < segmentsY; j++) {
        for (let i = 0; i < segmentsX; i++) {
            let row1 = j * (segmentsX + 1);
            let row2 = (j + 1) * (segmentsX + 1);

            indices.push(row1 + i, row2 + i, row1 + i + 1);
            indices.push(row1 + i + 1, row2 + i, row2 + i + 1);
        }
    }

    return { vertices, indices };
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
