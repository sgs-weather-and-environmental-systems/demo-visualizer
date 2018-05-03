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
 
var MyUtil;

(function() {
  "use strict";

  MyUtil = {

    toLabels: function(nums, p) {
        return nums.reduce(function(total,v,i,ary) {
            return i>0 ? total+','+(p?v.toFixed(p):v) : (p?v.toFixed(p):v)}, '');
    },
    sprintf: function(num, d) {
        // num is number, d is number of digits after decimal if num is not integer
        if (Number.isInteger(num)) return num;
        else if (typeof(num) == 'number') return num.toFixed(4);
        else return num;
    },

    toPrecision: function(x, p)  {
        return Number(x.toFixed(p));
    },
    toCeil: function(x, p) {
        return this.toPrecision(x + 0.5/Math.pow(10,p), p);
    },
    toFloor: function(x, p) {
        return this.toPrecision(x - 0.5/Math.pow(10,p), p);
    },
    
    min: function(items) {
        var found = items.length>0 ? items[0] : undefined;
        for (var idx=1; idx<items.length; idx++) {
            found = Math.min(items[idx], found);
        }
        return found;
    },
    max: function(items) {
        var found = items.length>0 ? items[0] : undefined;
        for (var idx=1; idx<items.length; idx++) {
            found = Math.max(items[idx], found);
        }
        return found;
    },
    
    reshape: function(vec, rows, cols) {
        // matlab column-based reshape: [1:9],3,3 => [1 4 7;2 5 8; 3 6 9]
        // [1:8],4,2 => [1,5;2,6;3,7;4,8]
        var t = [];
        for (var r = 0; r < rows; r++) {
            var row = [];
            for (var c = 0; c < cols; c++) {
                var i = c * rows + r;
                if (i < vec.length) {
                    row.push(vec[i]);
                } 
            }
            t.push(row);
        }
        return t;
    },
    reshape_rowbased: function(vec, rows, cols) {
        var t = [];
        var start=0;
        for (var r = 0; r < rows; r++, start+=cols) {
            var row = vec.slice(start, start+cols);
            t.push(row);
        }
        return t;
    },
    meshgrid: function(xvec, yvec) {
        var x = [];
        var y = [];
        for (var r=0; r<yvec.length; r++) {
            for (var c=0; c<xvec.length; c++) { 
                x.push(xvec[c]);
                y.push(yvec[r]);
            }
        }
        return [x,y];
    },
    tensor: function(vec1, vec2) { // outer product
        var t = [];
        for (var r=0; r<vec1.length; r++) {
            t.push(math.multiply(vec2, vec1[r]));
        }
        return t;
    }
    , foo:function(t,n,e,r){function o(){function o(){u=Number(new Date),e.apply(a,l)}function f(){i=void 0}var a=this,h=Number(new Date)-u,l=arguments;r&&!i&&o(),i&&clearTimeout(i),void 0===r&&h>t?o():n!==!0&&(i=setTimeout(r?f:o,void 0===r?t-h:t))}var i,u=0;return"boolean"!=typeof n&&(r=e,e=n,n=void 0),o}
  };

  if(typeof module !== "undefined")
    module.exports = MyUtil;
})();

