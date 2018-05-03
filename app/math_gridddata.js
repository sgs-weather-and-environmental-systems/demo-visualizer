/*
 * Copyright (c) 2017, Texas Instruments Incorporated
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * *  Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *
 * *  Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * *  Neither the name of Texas Instruments Incorporated nor the names of
 *    its contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
 
// 
// usage:
// var tmp =  new math_griddata();
//   var zi = tmp.griddata(x,y,z, xi,yi);
// If x,y,xi,yi are fixed and only z changes, better to do these,
//   tmp.init(x,y, xi,yi)
//   var zi = tmp.griddata_from_cache(z)

(function () {
    'use strict';

    function math_griddata() {
        if (!(this instanceof math_griddata))
            return new math_griddata();
    }

    math_griddata.prototype = { };
    
    function max3(a,b,c) {
        if (a < b) return (b < c ? c : b);
        else return (a < c ? c : a);
    }
    function min3(a,b,c) {
        if (a > b) return (b > c ? c : b);
        else return (a > c ? c : a);
    }
    
    function tsearch(x, y, tri, xi, yi) {
        // tri is from delaunay.triangulate()
        var eps = 1.0e-12;
        var nelem  = tri.length / 3; // number of triangles
        var minx = [], maxx=[], miny=[], maxy=[];
        // for each triangle, find its min and max of x and y 
        var idx;
        for (var k=0, idx=0; k<nelem; k++, idx+=3) {
            // 3k, 3k+1, 3k+2 are the 3 verticies of triangle k
            minx.push( min3(x[tri[idx]], x[tri[idx+1]], x[tri[idx+2]]) - eps );
            maxx.push( max3(x[tri[idx]], x[tri[idx+1]], x[tri[idx+2]]) + eps );
            miny.push( min3(y[tri[idx]], y[tri[idx+1]], y[tri[idx+2]]) - eps );
            maxy.push( max3(y[tri[idx]], y[tri[idx+1]], y[tri[idx+2]]) + eps );
        }
        var np = xi.length;
        var values = [];
        var x0, y0, a11, a12, a21, a22, det;
        x0 = y0 = 0.0;
        a11 = a12 = a21 = a22 = 0.0;
        det = 0.0;
        var k = nelem; // k is a counter of elements
        for (var kp=0; kp<np; kp++) {
            var xt = xi[kp];
            var yt = yi[kp];
            // check if last triangle contains the next point
            if (k < nelem) { 
                var dx1 = xt - x0;
                var dx2 = yt - y0;
                var c1 = (a22 * dx1 - a21 * dx2) / det; 
                var c2 = (-a12 * dx1 + a11 * dx2) / det; 
                if (c1 >= -eps && c2 >= -eps && (c1 + c2) <= (1 + eps)) { 
                    //values(kp) = double(k+1); 
                    values.push( [ tri[3*k], tri[3*k+1], tri[3*k+2] ] );
                    continue;
                }
            }
            // it doesn't, so go through all elements
            for (k = 0; k < nelem; k++) {
                if (xt >= minx[k] && xt <= maxx[k] && yt >= miny[k] && yt <= maxy[k]) {
                    // element inside the minimum rectangle: examine it closely
                    x0  = x[tri[3*k]];
                    y0  = y[tri[3*k]];
                    a11 = x[tri[3*k+1]] -x0;
                    a12 = y[tri[3*k+1]] -y0;
                    a21 = x[tri[3*k+2]] -x0;
                    a22 = y[tri[3*k+2]] -y0;
                    det = a11 * a22 - a21 * a12;
                    // solve the system 
                    var dx1 = xt - x0; 
                    var dx2 = yt - y0; 
                    var c1 = (a22 * dx1 - a21 * dx2) / det; 
                    var c2 = (-a12 * dx1 + a11 * dx2) / det;
                    if ((c1 >= -eps) && (c2 >= -eps) && ((c1 + c2) <= (1 + eps))) {
                        values.push( [ tri[3*k], tri[3*k+1], tri[3*k+2] ] );
                        break;
                    }
                } //endif # examine this element closely
            } //endfor # each element
            if (k == nelem) {
                values.push ( [ NaN, NaN, NaN ] )
            }
        } // endfor #kp
        return values;
    }
    
    function init(x, y, xi, yi) {
        var points = [];
        for (var idx=0; idx<x.length; idx++) {
            points.push( [x[idx], y[idx]] );
        }
        // scale x,y,xi,yi if points are too close and hit floating numeric issue.
        var triangles = Delaunay.triangulate(points);
        
        // Search for every point the enclosing triangle.
        this.tri_list = tsearch (x, y, triangles, xi, yi);
        this.x=x;
        this.y=y;
        this.xi = xi;
        this.yi = yi;
    }

    function griddata_from_cache(z) {
        // assume tri_list are pre-computed for xi, yi
        var x=this.x;
        var y=this.y;
        var xi= this.xi;
        var yi= this.yi;
        var zi = this.tri_list.map(function(val, idx, ary) {
            // val[0], val[1], val[2] are the 3 vertices of the triangle
            if (isNaN(val[0])) {
                return NaN;
            } else {
                var x1 = x[val[0]]; var x2 = x[val[1]]; var x3 = x[val[2]];
                var y1 = y[val[0]]; var y2 = y[val[1]]; var y3 = y[val[2]];
                var z1 = z[val[0]]; var z2 = z[val[1]]; var z3 = z[val[2]];
                var u1 = x2-x1; var u2 = y2-y1; var u3 = z2-z1;
                var v1 = x3-x1; var v2 = y3-y1; var v3 = z3-z1;
                var n1 = u2*v3 - u3*v2;
                var n2 = u3*v1 - u1*v3;
                var n3 = u1*v2 - u2*v1;
                var mag = Math.sqrt(n1*n1+n2*n2+n3*n3);
                n1 = n1/mag; n2 = n2/mag; n3 = n3/mag;
                var D = -(n1 * x1 + n2 * y1 + n3 * z1);
                return -(n1 * xi[idx] + n2 * yi[idx] + D) / n3;
            }
        });
        return zi;
    }
    
    function griddata(x, y, z, xi, yi) {
        // implement matlab griddata
        // x, y, z:  1-D array of same length. Represents z = function(x,y)
        // xi, yi: 1-D array of same length. Represents interpolation points
        // return zi: value at interpolation points
        init(x, y, xi, yi);
        return griddata_from_cache(z);
    }
    
    function test() {
        var tmp = templateObj.$.ti_widget_droplist_azimuth_resolution.selectedValue;
        var tmp2 = parseFloat(templateObj.$.ti_widget_textbox_frame_rate.getText());
        templateObj.$.ti_widget_slider_range_resolution.value = 50;
        console.log(tmp);
        console.log(tmp2);
        console.log(templateObj.$.ti_widget_slider_range_resolution.value);
    }
    
    math_griddata.prototype.init = init;
    math_griddata.prototype.griddata_from_cache = griddata_from_cache;
    math_griddata.prototype.griddata = griddata;
    math_griddata.prototype.tsearch = tsearch;
    math_griddata.prototype.test = test;

    // export as AMD/CommonJS module or global variable
    if (typeof define === 'function' && define.amd) define('math_griddata', function () { return math_griddata; });
    else if (typeof module !== 'undefined') module.exports = math_griddata;
    else if (typeof self !== 'undefined') self.math_griddata = math_griddata;
    else window.math_griddata = math_griddata;

})();