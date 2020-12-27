//import CameraNode from "./CameraNode";

const vec3 = glMatrix.vec3;
const mat4 = glMatrix.mat4;

export default class Physics {

    static CAMERA_GRAVITY = vec3.set(vec3.create(), 0, 0, 0.8);

    constructor(scene, plane) {
        this.scene = scene;
        this.plane = plane;
        this.wl = new Set();
    }

    whiteList(other) {
        for(const obj in this.plane) {
            if(other === obj) {
                return false
            }
        }
        return true;
    }

    update(dt) {
        this.scene.traverse(node => {
            if (node.velocity) {
                //console.log(node);
                vec3.scaleAndAdd(node.translation, node.translation, node.velocity, dt);
                node.updateTransform();
                this.scene.traverse(other => {
                    // const check = this.whiteList(other);
                    if (node !== other && other !== this.plane && !other.isCameraParent) {
                        this.resolveCollision(node, other);
                    }
                });
            }
        });
    }

    intervalIntersection(min1, max1, min2, max2) {
        return !(min1 > max2 || min2 > max1);
    }

    aabbIntersection(aabb1, aabb2) {
        //console.log(aabb1.min[0]);
        return this.intervalIntersection(aabb1.min[0], aabb1.max[0], aabb2.min[0], aabb2.max[0])
            && this.intervalIntersection(aabb1.min[1], aabb1.max[1], aabb2.min[1], aabb2.max[1])
            && this.intervalIntersection(aabb1.min[2], aabb1.max[2], aabb2.min[2], aabb2.max[2]);
    }

    intersection2d(aabb1, aabb2) {
        return this.intervalIntersection(aabb1.min[0], aabb1.max[0], aabb2.min[0], aabb2.max[0])
            && this.intervalIntersection(aabb1.min[2], aabb1.max[2], aabb2.min[2], aabb2.max[2]);
    }

    resolveCollision(a, b) {
        //console.log("ZORAN ZAEV");
        // Update bounding boxes with global translation.
       const ta = a.getGlobalTransform();
       const tb = b.getGlobalTransform();
       //const ta = a.matrix;
       //const tb = b.matrix;
       // console.log(ta, tb);
        const posa = mat4.getTranslation(vec3.create(), ta);
        const posb = mat4.getTranslation(vec3.create(), tb);

        const mina = vec3.add(vec3.create(), posa, a.aabb.min);
        const maxa = vec3.add(vec3.create(), posa, a.aabb.max);
        const minb = vec3.add(vec3.create(), posb, b.aabb.min);
        const maxb = vec3.add(vec3.create(), posb, b.aabb.max);

        const isColliding = this.aabbIntersection({
            min: mina,
            max: maxa
        }, {
            min: minb,
            max: maxb
        });

        if (!isColliding) {
            const collision2d = this.intersection2d({
                min: mina,
                max: maxa
            }, {
                min: minb,
                max: maxb
            });

            if(mina[1] > maxb[1] && collision2d) {
                if(!this.wl.has(b)) {
                    const height = maxb[1] + a.currentHeight;
                    console.log(height);
                    a.currentHeight = -height;
                    this.wl.add(b);
                }
            }
            else {
                if(this.wl.delete(b)) {
                    a.currentHeight = a.startHeight;
                }
              
            }
            if(this.wl.has(b)){
                return
            }
            return;
        }

        // Move node A minimally to avoid collision.
        const diffa = vec3.sub(vec3.create(), maxb, mina);
        const diffb = vec3.sub(vec3.create(), maxa, minb);

        let minDiff = Infinity;
        let minDirection = [0, 0, 0];
        if (diffa[0] >= 0 && diffa[0] < minDiff) {
            minDiff = diffa[0];
            minDirection = [minDiff, 0, 0];
        }
        if (diffa[1] >= 0 && diffa[1] < minDiff) {
            minDiff = diffa[1];
            minDirection = [0, minDiff, 0];
        }
        if (diffa[2] >= 0 && diffa[2] < minDiff) {
            minDiff = diffa[2];
            minDirection = [0, 0, minDiff];
        }
        if (diffb[0] >= 0 && diffb[0] < minDiff) {
            minDiff = diffb[0];
            minDirection = [-minDiff, 0, 0];
        }
        if (diffb[1] >= 0 && diffb[1] < minDiff) {
            minDiff = diffb[1];
            minDirection = [0, -minDiff, 0];
        }
        if (diffb[2] >= 0 && diffb[2] < minDiff) {
            minDiff = diffb[2];
            minDirection = [0, 0, -minDiff];
        }
        
        const temp = minDirection[2];
       // minDirection[2] = minDirection[1];
       minDirection[2] = 0;
        minDirection[1] = temp;
        vec3.add(a.translation, a.translation, minDirection);
        a.updateMatrix();
    }

}
