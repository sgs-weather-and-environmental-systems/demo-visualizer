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
// var tmp = new mmWaveInput();
// tmp.updateInput(); tmp.generateCfg();

// Code structure question:
// do we want to make this code purely no GUI (i.e. no read/change to gui widget values)
// so that it is easier to do auto unit testing
// and potentially for code re-use in other cases?

(function () {
    //'use strict';

    function mmWaveInput() {
        if (!(this instanceof mmWaveInput))
            return new mmWaveInput();
        
        this.init();
    }

    //mmWaveInput.prototype = { };
    
    var Platform = {
        xWR14xx: 'xWR14xx'
        , xWR16xx: 'xWR16xx'
    };
    function init() {
        this.Input = {
            lightSpeed: 300 // speed of light m/us
            , kB: 1.38064852e-23 // Bolzmann constant J/K, kgm^2/s^2K
            , cube_4pi: Math.pow(4*Math.PI, 3)
            , sdkVersionUint16: 0x0102 //careful : hex coding or you can express as (major << 8) | (minor)
            
            //, frequency_band: 77    // frequncy band: 77GHz with 4GHz bw, 76GHz with 1GHz bw
            
            //, platform: Platform.xWR16xx // xWR14xx, xWR16xx
            //, L3_memory_size: 256 // L3 memory size kB;  subject to platform
            //, ADCBuf_memory_size // Byte
            //, max_sampling_rate: 15 // max sampling rate - subject to platform
            //, min_interchirp_dur: 7 // us - subject to platform
            
            //, chirp_start_time: 7  // us
            //, chirp_end_time: 1 // us
            //, ADC_samples_type: 2 // 1 real, 2 complex
            //, ADC_bits: 16 // bits
            //, chirps_per_interrupt: 1
            
            //, Pt: 12 // transmit power dBm
            //, Gt: 8 // Minimum Transmit antenna gain in the FoV (dB)
            //, Gr:8 // Minimum Receive antenna gain in the FoV (dB)
            , T0_C: 20 // Ambient temperature, Celcius
            , T0_K: 293.15 // Ambient temperature, Kelvin
            //, NF // Noise figure (dB)
            
            //, subprofile_type: 'best_range_res' // choices: best_range_res|best_vel_res|best_range
            
            //, frame_rate: 25 // fps (frames/s);
            //, frame_rate_lo, frame_rate_hi
            //, frame duration = 1000/frame_rate (ms)
            
            //, azimuth_res: '15' // azimuth resolution deg: 15, 30, 60 (2RX), 60 (1RX); determine Rx and Tx
            //, num_Rx: 4  // number of Rx antennas
            //, num_Tx: 2  // number of Tx antennas
            //, num_virt_ant // number of virtual antenna
            
            //, ramp_slope: 20// Slope value (S) as part of range resolution computation, in MHz/us [5:5:100]
            //, ramp_slope_lo:5
            //, ramp_slope_hi:100
            //, total_bw: 4000 // Total Bandwidth : case 1 - for best range resolution: 4000 MHz for freq band=77GHz, 1000MHz for freq band=76GHz
            //, sweep_bw
            //, chirp_duration
            
            //, range_res    
            //, range_res_lo
            //, range_res_hi, 
            
            //, max_range: 1.13  // max unambiguous range 
            //, max_range_lo, max_range_hi
            
            //, max_radial_vel: 0.39
            //, N_chirps: 16
            
        };
    }
    
    var isRR= function(Input) {
        return Input.subprofile_type == 'best_range_res';
    };
    var isVR = function(Input) {
        return Input.subprofile_type == 'best_vel_res';
    };
    var isBestRange = function(Input) {
        return Input.subprofile_type == 'best_range';
    };
    
    var convertSensitivityLinearTodB = function(linear_value,platform,Num_Virt_Ant) {
        var dB_value;
        if (platform == Platform.xWR14xx) {
            dB_value = 6*linear_value/512;
        }
        else {
            dB_value = 6*linear_value/(256*Num_Virt_Ant);
        }
        return Math.ceil(dB_value);
    };
    
    var convertSensitivitydBToLinear = function(dB_value,platform,Num_Virt_Ant) {
        var linear_value;
        if (platform == Platform.xWR14xx) {
            linear_value = 512*dB_value/6;
        }
        else {
            linear_value = (256*Num_Virt_Ant)*dB_value/6;
        }
        return Math.ceil(linear_value);
    };
    
    var setDefaultRangeResConfig = function(Input) {
        if (!Input.platform) Input.platform = Platform.xWR16xx;
        Input.subprofile_type = 'best_range_res';
        Input.Frequency_band = 77;
        Input.Frame_Rate = 10;
        Input.Azimuth_Resolution = '15';
        Input.Ramp_Slope = 70;
        Input.Number_of_chirps = 32;
        Input.Num_ADC_Samples = 256;
        Input.Maximum_range = 9.02; //corresponds to 256 Samples
        Input.Maximum_radial_velocity = 1;
        Input.Doppler_FFT_size = 16; //corresponds to Number_of_chirps = 32
        
        // hack
        Input.RCS_desired = 0.5;
        Input.Doppler_Sensitivity = convertSensitivityLinearTodB(5000,Input.platform,8); //since azimuth is set to 15 deg, setting virt ant to 8
        if (Input.platform == Platform.xWR14xx) {
            Input.Range_Sensitivity = convertSensitivityLinearTodB(1200,8);
        } else {
            Input.Range_Sensitivity = convertSensitivityLinearTodB(5000,Input.platform,8);
        }
    };
    
    var setDefaultVelResConfig = function(Input) {
        if (!Input.platform) Input.platform = Platform.xWR16xx;
        Input.subprofile_type = 'best_vel_res';
        Input.Frequency_band = 77;
        Input.Frame_Rate = 10;
        Input.Azimuth_Resolution = '15';
        Input.Bandwidth = 2;
        Input.Doppler_FFT_size = 128;
        Input.Num_ADC_Samples = 64;
        if (Input.platform == Platform.xWR14xx)
        {
            Input.Doppler_FFT_size = 64;
        } else {
            Input.Doppler_FFT_size = 128;
        }

        // hack
        Input.RCS_desired = 0.5;
        Input.Doppler_Sensitivity = convertSensitivityLinearTodB(5000,Input.platform,8);
        if (Input.platform == Platform.xWR14xx) {
            Input.Range_Sensitivity = convertSensitivityLinearTodB(1200,8);
        } else {
            Input.Range_Sensitivity = convertSensitivityLinearTodB(5000,Input.platform,8);
        }
    };
    
    var setDefaultRangeConfig = function(Input) {
        if (!Input.platform) Input.platform = Platform.xWR16xx;
        Input.subprofile_type = 'best_range';
        Input.Frequency_band = 77;
        Input.Frame_Rate = 10;
        Input.Azimuth_Resolution = '15';
        Input.Maximum_range = 50;
        Input.Number_of_chirps = 32; //for 14xx this will end up being 16
        Input.Num_ADC_Samples = 256; 
        Input.Maximum_radial_velocity = 1;

        // hack
        Input.RCS_desired = 0.5;
        Input.Doppler_Sensitivity = convertSensitivityLinearTodB(5000,Input.platform,8);
        if (Input.platform == Platform.xWR14xx) {
            Input.Range_Sensitivity = convertSensitivityLinearTodB(1200,8);
        } else {
            Input.Range_Sensitivity = convertSensitivityLinearTodB(5000,Input.platform,8);
        }
    };
    
    var setSliderRange = function(widget, min, max) {
        // work around slider bug 
        if (max < widget.minValue) {
            widget.minValue = min; widget.maxValue = max;
        } else {
            widget.maxValue = max; widget.minValue = min;
        }
    };
    
    var rangeResolutionConstraints1 = function(lightSpeed, total_bw, ramp_slope_lo, ramp_slope_hi, chirp_start_time, chirp_end_time) {
        // for RR
        var range_res_lo = MyUtil.toPrecision( lightSpeed / ( 2* ( total_bw - ramp_slope_lo * (chirp_start_time + chirp_end_time) ) ), 3);
        var range_res_hi = MyUtil.toPrecision( lightSpeed / ( 2* ( total_bw - ramp_slope_hi * (chirp_start_time + chirp_end_time) ) ), 3);
        
        setSliderRange(templateObj.$.ti_widget_slider_range_resolution, ramp_slope_lo, ramp_slope_hi);
        templateObj.$.ti_widget_slider_range_resolution.increment = 5;
        templateObj.$.ti_widget_slider_range_resolution.labels = MyUtil.toLabels([range_res_lo, range_res_hi]);
    };
    var rangeResolutionConstraints2 = function(lightSpeed, Sweep_BW, min_Bandwidth, max_Bandwidth) {
        // for VR
        //var tmp = MyUtil.toPrecision( lightSpeed / ( 2* ( total_bw - ramp_slope * (chirp_start_time + chirp_end_time) ) ), 3);
        var range_res_lo = MyUtil.toPrecision( lightSpeed / ( 2* Sweep_BW ), 3);
        var range_res_hi = MyUtil.toPrecision( lightSpeed / ( 2* Sweep_BW ), 3);
        
        setSliderRange(templateObj.$.ti_widget_slider_range_resolution, min_Bandwidth, max_Bandwidth);
        templateObj.$.ti_widget_slider_range_resolution.increment = 0.5;
        //templateObj.$.ti_widget_slider_range_resolution.labels = MyUtil.toLabels([range_res_lo, range_res_hi]);
        templateObj.$.ti_widget_slider_range_resolution.labels = MyUtil.toLabels(["coarse", "fine"]);
    };
    var rangeResolutionConstraints3 = function(Maximum_range, adc_samples_lo, max_num_adc_samples) {
        // for best range
        var range_res_lo = MyUtil.toPrecision(Maximum_range/(0.8*max_num_adc_samples), 3);
        var range_res_hi = MyUtil.toPrecision(Maximum_range/(0.8*adc_samples_lo), 3);
        
        if (adc_samples_lo==max_num_adc_samples) {
            max_num_adc_samples=max_num_adc_samples+1; //hack
        }

        setSliderRange(templateObj.$.ti_widget_slider_range_resolution, adc_samples_lo, max_num_adc_samples);
        templateObj.$.ti_widget_slider_range_resolution.increment = 16;
        templateObj.$.ti_widget_slider_range_resolution.labels = MyUtil.toLabels([range_res_hi, range_res_lo]);
    };
    var maxRangeConstraints1 = function(max_range_lo, max_range_hi, inc) {
        // for RR, best range
        if (max_range_lo+inc > max_range_hi) {
            max_range_hi = max_range_lo;
        }
        
        templateObj.$.ti_widget_slider_max_range.labels = MyUtil.toLabels([max_range_lo, max_range_hi]);
        setSliderRange(templateObj.$.ti_widget_slider_max_range, max_range_lo, max_range_hi);
        templateObj.$.ti_widget_slider_max_range.increment = inc;
    };
    var maxRangeConstraints2 = function(max_range_lo, max_range_hi, adc_samples_lo, max_num_adc_samples) {
        // for VR
        //templateObj.$.ti_widget_slider_max_range.labels = MyUtil.toLabels([max_range_lo, max_range_hi]);
        setSliderRange(templateObj.$.ti_widget_slider_max_range, adc_samples_lo, max_num_adc_samples);
        templateObj.$.ti_widget_slider_max_range.increment = 16;
        templateObj.$.ti_widget_slider_max_range.labels = MyUtil.toLabels(["min", "max"]);
    };
    var radialVelocityConstraints1 = function(max_radial_vel_lo, max_radial_vel_hi, inc) {
        // for RR, best range
        templateObj.$.ti_widget_slider_max_radial_vel.labels = MyUtil.toLabels([max_radial_vel_lo, max_radial_vel_hi]);
        setSliderRange(templateObj.$.ti_widget_slider_max_radial_vel, max_radial_vel_lo, max_radial_vel_hi);
        templateObj.$.ti_widget_slider_max_radial_vel.increment = inc;
    };
    var radialVelocityConstraints2 = function(max_radial_vel_lo, max_radial_vel_hi, N_fft2d_lo, N_fft2d_hi) {
        // for VR
        var lo = Math.log2(N_fft2d_lo);
        var hi = Math.log2(N_fft2d_hi);
        templateObj.$.ti_widget_slider_max_radial_vel.labels = MyUtil.toLabels([max_radial_vel_lo, max_radial_vel_hi]);
        setSliderRange(templateObj.$.ti_widget_slider_max_radial_vel, lo, hi);
        templateObj.$.ti_widget_slider_max_radial_vel.increment = 1;
    };
    
    var velocityResolutionConstraints1 = function(max_number_of_chirps, Number_of_TX, N_fft2d_lo, Maximum_radial_velocity, Doppler_FFT_size) {
        // for RR, best range
        var radial_vel_res_values = [];
        var radial_vel_res_labels = [];
        for (var tmp=max_number_of_chirps/Number_of_TX; tmp>=N_fft2d_lo; tmp=tmp>>1) {
            radial_vel_res_values.push(tmp);
            radial_vel_res_labels.push(MyUtil.toCeil(Maximum_radial_velocity / (tmp/2), 2));
        }
        templateObj.$.ti_widget_droplist_radial_vel_resolution.disabled=false;
        templateObj.$.ti_widget_droplist_radial_vel_resolution.values=radial_vel_res_values.join('|');
        templateObj.$.ti_widget_droplist_radial_vel_resolution.labels=radial_vel_res_labels.join('|');
        
        // hack
        var value = parseInt(templateObj.$.ti_widget_droplist_radial_vel_resolution.selectedValue, 10);
        if (isNaN(value) === true) value = Doppler_FFT_size;
        var idx = radial_vel_res_values.indexOf(value);
        if (idx >= 0) {
            if (templateObj.$.ti_widget_droplist_radial_vel_resolution.selectedValue != radial_vel_res_values[idx])
                templateObj.$.ti_widget_droplist_radial_vel_resolution.selectedValue = radial_vel_res_values[idx];
        } else {
            templateObj.$.ti_widget_droplist_radial_vel_resolution.selectedValue = radial_vel_res_values.length > 0 ? radial_vel_res_values[0] : undefined;
        }
    };
    
    
    
    var velocityResolutionConstraints2 = function(radial_velocity_resolution) {
        // for VR
        templateObj.$.ti_widget_droplist_radial_vel_resolution.disabled=true;
        templateObj.$.ti_widget_droplist_radial_vel_resolution.labels=radial_velocity_resolution.toString();
        templateObj.$.ti_widget_droplist_radial_vel_resolution.selectedIndex = 0;
    };

    var updateInput = function(changes) {
        var Input = this.Input;
        for (var k in changes) {
            if (changes.hasOwnProperty(k)) {
                Input[k] = changes[k];
            }
        }
        
        if (Input.platform == Platform.xWR14xx) {
            Input.L3_Memory_size = 256;
            Input.CFAR_memory_size = 32768;     //Bytes
            Input.CFAR_window_memory_size = 1024; //words - 32-bits
            Input.ADCBuf_memory_size = 16384;
            Input.Max_Sampling_Rate = 18.5; //room for some round off errors.
            Input.Min_Sampling_rate = 2; //Msps
            if (!Input.Num_Virt_Ant) Input.Num_Virt_Ant = 8;
            if (!Input.Range_Sensitivity) Input.Range_Sensitivity = convertSensitivityLinearTodB(1200,Input.platform,Input.Num_Virt_Ant);
            Input.max_number_of_rx = 4;
            Input.max_number_of_tx = 3;
        } else if (Input.platform == Platform.xWR16xx) {
            Input.L3_Memory_size = 640;
            Input.ADCBuf_memory_size = 32768;
            Input.CFAR_memory_size = 0;     //Bytes - NA
            Input.CFAR_window_memory_size = 1024; //words - 32-bits - NA
            Input.Max_Sampling_Rate = 6.25;
            Input.Min_Sampling_rate = 2; //Msps
            if (!Input.Num_Virt_Ant) Input.Num_Virt_Ant = 8;
            if (!Input.Range_Sensitivity) Input.Range_Sensitivity = convertSensitivityLinearTodB(5000,Input.platform,Input.Num_Virt_Ant);
            if (!Input.Doppler_Sensitivity) Input.Doppler_Sensitivity = convertSensitivityLinearTodB(5000,Input.platform,Input.Num_Virt_Ant);
            Input.max_number_of_rx = 4;
            Input.max_number_of_tx = 2;
        }
        
        //Input.Azimuth_Resolution;
        if (Input.Azimuth_Resolution == '15 + Elevation') {
            if (Input.platform == Platform.xWR14xx) {
                Input.Number_of_RX = 4; 
                Input.Number_of_TX = 3;
            } else { 
                Input.Number_of_RX = 4; 
                Input.Number_of_TX = 2;
            }
        } else if (Input.Azimuth_Resolution == '15') {
            Input.Number_of_RX = 4; 
            Input.Number_of_TX = 2;
        } else if (Input.Azimuth_Resolution == '30') {
            Input.Number_of_RX = 4; 
            Input.Number_of_TX = 1;
        } else if (Input.Azimuth_Resolution == '90') {
            Input.Number_of_RX = 2; 
            Input.Number_of_TX = 1;
        } else if (Input.Azimuth_Resolution == 'None (1Rx/1Tx)') {
            Input.Number_of_RX = 1; 
            Input.Number_of_TX = 1;
        }
        Input.Num_Virt_Ant = Input.Number_of_RX*Input.Number_of_TX;

        Input.ADC_bits = 16;
        Input.ADC_samples_type = 2; // 1-real, 2-complex

        //Input.Bandwidth;
        Input.Bandwidth_list = [0.5, 1, 1,5, 2, 2.5, 3, 3.5, 4]; // GHz
        Input.Min_Allowable_Bandwidth = 0.5; // GHz

        Input.Chirp_end_guard_time = 1;

        //Set chirps per interrupt to 0 (maximize chirps) for xwr16xx and if SDK version at or beyond 1.1.x.x    
        if ((Input.platform == Platform.xWR16xx) && (Input.sdkVersionUint16 >= 0x0101)) {
            Input.chirps_per_interrupt = 0; //max possible
        }
        else {
            Input.chirps_per_interrupt = 1;
        }

        Input.Chirp_Start_Time = 7;
        Input.Min_Interchirp_dur = 7;
        
        Input.Doppler_FFT_list = [16, 32, 64, 128, 256];
        var N_fft2d_lo = Input.Doppler_FFT_list[0];
        var adc_samples_lo = 64; // radar FE expects this as minimum value
        //Input.Doppler_Sensitivity = 5000;
        //Input.Frame_Rate;
        //Input.Frequency_band;

        Input.Max_Slope = 100;
        Input.Maximum_range_list = [5,10,15,20,25,30,35,40,45,50]; // Range sheet
        
        Input.Gr = 8;
        Input.Gt = 8;
        Input.Ld = 2;
        Input.Lim = 2;
        //Input.Lncoh = IF(Num_Virt_Ant=8;3;IF(Num_Virt_Ant=4;2;(IF(Num_Virt_Ant=2;1;0))));
        if (Input.Num_Virt_Ant == 8) Input.Lncoh = 3; 
        else if (Input.Num_Virt_Ant == 4) Input.Lncoh = 2;
        else if (Input.Num_Virt_Ant == 2) Input.Lncoh = 1;
        else Input.Lncoh = 0;
        Input.Ls = 1;
        Input.NF = Input.Frequency_band == 77 ? 16 : 15;
        Input.Pt = 12;
        Input.SNR_det = 12;
        Input.loss_dB = Input.Pt+Input.Gt+Input.Gr-Input.Lncoh-Input.Ld-Input.Ls-Input.Lim-Input.SNR_det-Input.NF;
        Input.loss_linear = Math.pow(10, Input.loss_dB/10);


        Input.Max_Allowable_Bandwidth = Input.Frequency_band == 77 ? 4 : 1;// GHz
        Input.Total_BW;
        var tmp = isRR(Input);
        if (Input.subprofile_type == 'best_range_res') {
            if (Input.Frequency_band == 77) {
                Input.Bandwidth  = 4;
            } else if (Input.Frequency_band == 76) {
                Input.Bandwidth = 1;
            }
            Input.Total_BW  = Input.Bandwidth * 1000; 
            Input.min_Ramp_Slope = 20;
            if (Input.platform == Platform.xWR14xx) {
                Input.min_Ramp_Slope = 35; //max ADC samples is 256
            }
            if (!Input.Ramp_Slope) Input.Ramp_Slope = Input.min_Ramp_Slope; //preset
            if (!Input.Number_of_chirps) Input.Number_of_chirps = 16;//preset
            Input.Max_Slope = Math.min(Input.Max_Slope,
                                       Math.floor((Input.Max_Allowable_Bandwidth * 1000 * Input.Max_Sampling_Rate)/
                                                    (adc_samples_lo+Input.Max_Sampling_Rate*(Input.Chirp_Start_Time+Input.Chirp_end_guard_time))));
            Input.Max_Slope = Math.floor(Input.Max_Slope /5) * 5;
            rangeResolutionConstraints1(Input.lightSpeed, Input.Total_BW, Input.min_Ramp_Slope, Input.Max_Slope, Input.Chirp_Start_Time, Input.Chirp_end_guard_time);
        } else if (Input.subprofile_type == 'best_vel_res') {
            if (!Input.Bandwidth) Input.Bandwidth = 0.5;//preset
            if (!Input.Num_ADC_Samples) Input.Num_ADC_Samples = adc_samples_lo;
            if (!Input.Doppler_FFT_size) Input.Doppler_FFT_size = N_fft2d_lo;
            Input.Total_BW  = Input.Bandwidth * 1000;
        } else if (Input.subprofile_type == 'best_range') {
            if (!Input.Number_of_chirps) Input.Number_of_chirps = 16;//preset
        }

        Input.Frame_duration = MyUtil.toPrecision(1000/Input.Frame_Rate,3);
        var max_Ramp_Slope1 = Math.floor(Input.Bandwidth*1000/((32/Input.Max_Sampling_Rate)+Input.Chirp_Start_Time+Input.Chirp_end_guard_time));
        Input.max_Ramp_Slope = Math.max(Math.min(Input.Max_Slope,max_Ramp_Slope1),5);

        if (Input.subprofile_type == 'best_vel_res') {
            Input.Radial_velocity_Resolution = MyUtil.toCeil(Input.lightSpeed/(Input.Frequency_band*Input.Frame_duration), 2); // VR sheet
            Input.Maximum_radial_velocity = MyUtil.toPrecision(Input.Radial_velocity_Resolution*Input.Doppler_FFT_size/2, 2);// VR sheet
            Input.Number_of_chirps = Input.Doppler_FFT_size*Input.Number_of_TX;//VR
            Input.min_Ramp_Slope = Math.min(MyUtil.toPrecision(Input.Bandwidth*1000/((Input.Frame_duration*1000/(2*Input.Number_of_chirps))-Input.Min_Interchirp_dur),3),Input.max_Ramp_Slope);
            Input.Ramp_Slope = Math.max(Math.min(MyUtil.toPrecision(Input.Bandwidth*1000/(Input.Chirp_end_guard_time+Input.Chirp_Start_Time+
                Input.Num_ADC_Samples/Input.Max_Sampling_Rate), 3),Input.Max_Slope),Input.min_Ramp_Slope); // VR sheet
        } else if (Input.subprofile_type == 'best_range') {
            Input.Range_Resolution = MyUtil.toPrecision(Input.Maximum_range/(0.8*Input.Num_ADC_Samples), 3); // Range Sheet
            Input.Sweep_BW = MyUtil.toPrecision(Input.lightSpeed/(2*Input.Range_Resolution),3); // Range Sheet
            
            var ramp_slope1 = MyUtil.toPrecision(Input.lightSpeed*0.8*Input.Max_Sampling_Rate/(2*Input.Maximum_range),3);
            var ramp_slope2 = MyUtil.toCeil((Input.Max_Allowable_Bandwidth * 1000 - (Input.lightSpeed*0.8*Input.Num_ADC_Samples/(2*Input.Maximum_range)))/(Input.Chirp_Start_Time+Input.Chirp_end_guard_time),3);
            if(ramp_slope2<=0) {
                ramp_slope2 = ramp_slope1;
            }
            Input.Ramp_Slope = MyUtil.min([ramp_slope1,ramp_slope2,Input.Max_Slope]); // Range Sheet
        }

        if (Input.subprofile_type != 'best_range') {
            Input.Chirp_duration = MyUtil.toPrecision(Input.Total_BW/Input.Ramp_Slope, 2);//RR,VR
            Input.ADC_Collection_Time = MyUtil.toPrecision(Input.Chirp_duration-Input.Chirp_Start_Time-Input.Chirp_end_guard_time, 2);//RR,VR
            Input.Sweep_BW = MyUtil.toPrecision(Input.ADC_Collection_Time*Input.Ramp_Slope,3);
            Input.Range_Resolution = MyUtil.toPrecision(Input.lightSpeed / ( 2* ( Input.Sweep_BW ) ), 3);
            Input.ADC_Sampling_Rate = MyUtil.toFloor(Input.Ramp_Slope*Input.Num_ADC_Samples/Input.Sweep_BW, 3); //RR,VR
            Input.Range_FFT_size = 1<<Math.ceil(Math.log2(Input.Num_ADC_Samples)); // TODO hack see below //MMWSDK-580
        } else {
            Input.ADC_Collection_Time = MyUtil.toPrecision(Input.Sweep_BW/Input.Ramp_Slope,2); // Range Sheet
            Input.Chirp_duration = MyUtil.toPrecision(Input.ADC_Collection_Time+Input.Chirp_end_guard_time+Input.Chirp_Start_Time,2); // Range Sheet
            Input.ADC_Sampling_Rate = MyUtil.toFloor(2*Input.Ramp_Slope*Input.Maximum_range/(Input.lightSpeed*0.8),3); // Range Sheet
            Input.Total_BW = Input.Chirp_duration*Input.Ramp_Slope; // Range Sheet
            Input.Range_FFT_size = 1<<Math.ceil(Math.log2(Input.Num_ADC_Samples)); // TODO hack see below
        }
        
        if (Input.subprofile_type != 'best_vel_res') {
            Input.Doppler_FFT_size = Input.Number_of_chirps/Input.Number_of_TX;
        }
        //Input.Doppler_FFT_size = from max radial velocity selection // VR Sheet
        
        Input.frame_rate_max = 1000000/((Input.Total_BW/Input.Ramp_Slope + Input.Min_Interchirp_dur)*Input.Doppler_FFT_size*Input.Number_of_TX*2);
        Input.frame_rate_min = 1;
        if (Input.subprofile_type != 'best_vel_res') {
            Input.Inter_chirp_duration = Math.floor((Input.lightSpeed*1000)/(4*Input.Frequency_band*Input.Maximum_radial_velocity*Input.Number_of_TX)-Input.Chirp_duration);
        } else {
            Input.Inter_chirp_duration = Math.floor((((Input.Frame_duration/2)/Input.Number_of_chirps)*1000)-Input.Chirp_duration); // VR sheet
        }
        Input.Frame_time_active = (Input.Chirp_duration+Input.Inter_chirp_duration)*Input.Number_of_chirps/1000;

        var max_Bandwidth1 = Input.Max_Slope*(Input.Frame_duration*1000/(2*Input.Number_of_TX*Input.Doppler_FFT_size) - Input.Min_Interchirp_dur)/1000;
        var max_Bandwidth2 = Math.floor(((Input.lightSpeed/(Input.Maximum_radial_velocity*Input.Frame_duration))+((Input.Max_Slope*(Input.Chirp_end_guard_time+Input.Chirp_Start_Time))/1000))/0.5,1)*0.5;
        Input.max_Bandwidth = MyUtil.min([Input.Max_Allowable_Bandwidth, max_Bandwidth1 ,max_Bandwidth2]);
        
        Input.max_Inter_chirp_dur = 5242.87;

        var max_inter_chirp_duration1 =(((Input.Frame_duration/2)/Input.Number_of_chirps)*1000)-Input.Chirp_duration;
        var idleTime_hi = 5242.87;
        Input.max_inter_chirp_duration = MyUtil.toFloor(Math.min(max_inter_chirp_duration1,idleTime_hi), 2);

        var N_fft1d_max1;
        var adc_samples_lo_calc = adc_samples_lo;
        var N_fft1d_max2 = 1<<Math.floor(Math.log2((Input.L3_Memory_size*1024/(4*Input.Number_of_RX*Input.Number_of_TX+2)) / N_fft2d_lo));//RR,best range
        var N_fft1d_max4 = 4096; //junk - big value
        var N_fft1d_max5 = 4096; //junk - big value
        var N_fft1d_max6 = 4096; //junk - big value
        if (Input.platform == Platform.xWR14xx) {
            N_fft1d_max4 = 1<<Math.floor(Math.log2(Input.CFAR_memory_size/(2 * N_fft2d_lo)));
            N_fft1d_max6 = Input.CFAR_window_memory_size - N_fft2d_lo; //MMWSDK-578
        }
        if (Input.subprofile_type == 'best_range_res') {
            N_fft1d_max1 = Input.Max_Sampling_Rate*Input.Sweep_BW/Input.Ramp_Slope;
            adc_samples_lo_calc = Math.max(adc_samples_lo,Math.ceil(Input.Sweep_BW * Input.Min_Sampling_rate/Input.Ramp_Slope));
            adc_samples_lo_calc = 16 * Math.ceil(adc_samples_lo_calc/16); //MMWSDK-587
        } else if (Input.subprofile_type == 'best_vel_res') {
            N_fft1d_max1 = (Input.Frame_duration*1000/(2*Input.Number_of_TX*Input.Doppler_FFT_size)-
                Input.Min_Interchirp_dur-Input.Chirp_end_guard_time-Input.Chirp_Start_Time)*Input.Max_Sampling_Rate; // VR sheet
            N_fft1d_max2 = 1<<Math.floor(Math.log2((Input.L3_Memory_size*1024/(4*Input.Number_of_RX+2/Input.Number_of_TX)) / Input.Number_of_chirps)); // VR sheet
            if (Input.platform == Platform.xWR14xx) {
                N_fft1d_max4 = 1<<Math.floor(Math.log2(Input.CFAR_memory_size*Input.Number_of_TX/(2 * Input.Number_of_chirps)));
                N_fft1d_max6 = Input.CFAR_window_memory_size - (Input.Number_of_chirps/Input.Number_of_TX); //MMWSDK-578
            }
            N_fft1d_max5 = Math.floor(50/(0.8 * Input.Range_Resolution), 2); //limit to 50m
        } else if (Input.subprofile_type == 'best_range') {
            N_fft1d_max1 = (Input.Max_Allowable_Bandwidth*1000-Input.Ramp_Slope*(Input.Chirp_end_guard_time+Input.Chirp_Start_Time))
                *Input.ADC_Sampling_Rate/Input.Ramp_Slope; // Range Sheet
        }
        N_fft1d_max1 = Math.floor(N_fft1d_max1);

        //if chirps per interrupt is set to max allowed, then for limits compute purposes, 
        //need to use 1, else what is intended by user.
        var chirpsPerInt;
        if (Input.chirps_per_interrupt == 0) {
            chirpsPerInt = 1;
        }
        else {
            chirpsPerInt = Input.chirps_per_interrupt;
        }
        var N_fft1d_max3 = Math.floor(Input.ADCBuf_memory_size/(Input.Number_of_RX * chirpsPerInt * Input.ADC_bits / 8 * Input.ADC_samples_type));

        Input.max_num_adc_samples = MyUtil.min([N_fft1d_max1, N_fft1d_max2, N_fft1d_max3, N_fft1d_max4, N_fft1d_max5, N_fft1d_max6]);
        Input.max_num_adc_samples = MyUtil.max([Input.max_num_adc_samples,adc_samples_lo_calc]);
        
        if (Input.subprofile_type == 'best_vel_res') {
            var max2 = (Input.L3_Memory_size*1024/(4*Input.Number_of_RX+2/Input.Number_of_TX))/adc_samples_lo;
            var max3 = (Input.Frame_duration/2)*1000/(Input.Min_Interchirp_dur+Input.Chirp_Start_Time+Input.Chirp_end_guard_time+(adc_samples_lo/Input.Max_Sampling_Rate));
            var max4 = 4096; //junk - large value
            var max5 = 4096; //junk - large value
            if (Input.platform == Platform.xWR14xx) {
                max4 = Input.CFAR_memory_size*Input.Number_of_TX/(2 * adc_samples_lo);
                max5 = (Input.CFAR_window_memory_size - adc_samples_lo)* Input.Number_of_TX;
            }
            var max6 = 255 *Input.Number_of_TX; // RF front end requirement
            Input.max_number_of_chirps = (1<<Math.floor( Math.log2(MyUtil.min([max2,max3,max4,max5,max6])/Input.Number_of_TX) ))*Input.Number_of_TX;
        } else {
            var chirp_limits=[];
            chirp_limits.push( 2*Input.Frequency_band/(Input.Sweep_BW/1000)*Input.Number_of_TX );//RR,range,
            chirp_limits.push( (Input.L3_Memory_size*1024/(4*Input.Number_of_RX+2/Input.Number_of_TX))/Input.Range_FFT_size );//RR,range
            if (Input.platform == Platform.xWR14xx) {
                chirp_limits.push( Input.CFAR_memory_size*Input.Number_of_TX/(2 * Input.Range_FFT_size) );//RR,range
                chirp_limits.push( (Input.CFAR_window_memory_size - Input.Range_FFT_size)* Input.Number_of_TX);//RR,range
            }
            chirp_limits.push( 255 * Input.Number_of_TX); // Rf front end requirement
            if (Input.subprofile_type == 'best_range') {
                chirp_limits.push( (Input.Frame_duration*1000/2)/(Input.Inter_chirp_duration+Input.Chirp_duration) ); // range
            }
            Input.max_number_of_chirps = (1<<Math.floor( Math.log2(MyUtil.min(chirp_limits)/Input.Number_of_TX) ))*Input.Number_of_TX;
        }

        //Input.Maximum_radial_velocity; // directly from widget for RR, best range
        //Input.Maximum_range; // directly from widget for RR, best range
        if (Input.subprofile_type == 'best_vel_res') {
            Input.Maximum_range = MyUtil.toFloor(0.8*Input.Range_Resolution*Input.Num_ADC_Samples, 2); // VR sheet // Winnie's bug : Note Math.floor() only takes 1 arg. Use MyUtil.toFloor(n, p)
        }

        
        Input.min_Bandwidth = Input.Min_Allowable_Bandwidth;

        if (Input.subprofile_type == 'best_range_res') {
            // best range: range resolution widget selcts num adc samples directly
            // VR: max range widget selects num add samples directly
            // [ hack
            if (Input.Num_ADC_Samples && !Input.Maximum_range) {
                // logic came here since Max Range value is out of bounds for min/max set in previous call.
                // so num ADC samples cannot be trusted as well.
                if ((Input.Num_ADC_Samples<adc_samples_lo_calc) || (Input.Num_ADC_Samples > Input.max_num_adc_samples)) {
                    Input.Num_ADC_Samples = adc_samples_lo_calc;
                }
                Input.Maximum_range = MyUtil.toFloor(0.8*Input.Range_Resolution,2)*Input.Num_ADC_Samples;
            } else { //]
                Input.Num_ADC_Samples = 16 * Math.floor(Input.Maximum_range/(0.8*Input.Range_Resolution*16)); // but range sheet: range resolution widget selcts num adc samples directly
            }
            Input.ADC_Sampling_Rate = MyUtil.toFloor(Input.Ramp_Slope*Input.Num_ADC_Samples/Input.Sweep_BW, 3); //RR,VR
            Input.Range_FFT_size = 1<<Math.ceil(Math.log2(Input.Num_ADC_Samples));
        }
        /*
        if (Input.subprofile_type == 'best_vel_res') {// repeat
            Input.Radial_velocity_Resolution = MyUtil.toCeil(Input.lightSpeed/(Input.Frequency_band*Input.Frame_duration), 2); // VR sheet
            Input.Maximum_radial_velocity = MyUtil.toPrecision(Input.Radial_velocity_Resolution*Input.Doppler_FFT_size/2, 2);// VR sheet
            Input.Number_of_chirps = Input.Doppler_FFT_size*Input.Number_of_TX;//VR
            Input.min_Ramp_Slope = Math.min(MyUtil.toPrecision(Input.Bandwidth*1000/((Input.Frame_duration*1000/(2*Input.Number_of_chirps))-Input.Min_Interchirp_dur),3),Input.max_Ramp_Slope);
            Input.Ramp_Slope = Math.max(Math.min(MyUtil.toPrecision(Input.Bandwidth*1000/(Input.Chirp_end_guard_time+Input.Chirp_Start_Time+
                Input.Num_ADC_Samples/Input.Max_Sampling_Rate), 3),Input.Max_Slope),Input.min_Ramp_Slope); // VR sheet
        } else if (Input.subprofile_type == 'best_range') {
            Input.Ramp_Slope = Math.min(Input.lightSpeed*Input.Max_Sampling_Rate/(2*Input.Maximum_range),Input.Max_Slope); // Range Sheet
        }
        */
        Input.Non_sweep_BW =(Input.Chirp_Start_Time+Input.Chirp_end_guard_time)*Input.Ramp_Slope;

        //Input.Range_FFT_size = 1<<Math.ceil(Math.log2(Input.ADC_Sampling_Rate*Input.ADC_Collection_Time)); // TODO hack move up a bit
        
        if (Input.subprofile_type != 'best_range') {//repeat
            Input.Sweep_BW = Input.ADC_Collection_Time*Input.Ramp_Slope;
            Input.Range_Resolution = MyUtil.toPrecision(Input.lightSpeed / ( 2* ( Input.Sweep_BW ) ), 3);
        } else {
            Input.Range_Resolution = MyUtil.toPrecision(Input.Maximum_range/(0.8*Input.Num_ADC_Samples), 3); // Range Sheet
            Input.Sweep_BW = MyUtil.toPrecision(Input.lightSpeed/(2*Input.Range_Resolution),3); // Range Sheet
        }
        
        Input.Range_high = MyUtil.toFloor(0.8 * Input.Range_Resolution * Input.max_num_adc_samples, 2);
        Input.Range_low = MyUtil.toCeil(0.8 * Input.Range_Resolution * adc_samples_lo_calc, 2);
        
        if (Input.subprofile_type == 'best_range_res') {
            var RangeIncrements = 0.01;
            if (Input.platform == Platform.xWR16xx) {
                RangeIncrements = MyUtil.toCeil(0.8 * Input.Range_Resolution * 16, 2);
            }
            maxRangeConstraints1(Input.Range_low, Input.Range_high, RangeIncrements);
        } else if (Input.subprofile_type == 'best_vel_res') {
            rangeResolutionConstraints2(Input.lightSpeed, Input.Sweep_BW, Input.min_Bandwidth, Input.max_Bandwidth);
            maxRangeConstraints2(Input.Range_low, Input.Range_high, adc_samples_lo, Input.max_num_adc_samples);
        } else if (Input.subprofile_type == 'best_range') {
            var lo = Input.Maximum_range_list[0];
            if (Input.Frequency_band == 76) {
                lo = Input.Maximum_range_list[1]; // (c*0.8*adc_samples_lo/1Ghz)/2 = 7.68 //MMWSDK-590
            }
            var hi = Input.Maximum_range_list[Input.Maximum_range_list.length-1];
            var inc = Input.Maximum_range_list[1]-Input.Maximum_range_list[0];
            maxRangeConstraints1(lo,hi,inc);
            rangeResolutionConstraints3(Input.Maximum_range, adc_samples_lo, Input.max_num_adc_samples);
        }
        
        Input.Wavelength = Input.lightSpeed/Input.Frequency_band;
        
        //Input.Range_Sensitivity = 5000;
        Input.RCS_des_max = Input.RCS_Rmax;
        //Input.RCS_desired;
        var max_range_exp_4 = Math.pow(Input.Maximum_range,4);// * Input.Maximum_range * Input.Maximum_range * Input.Maximum_range;
        var wavelength_exp_2 = Math.pow(Input.Wavelength,2);// * Input.Wavelength;
        Input.RCS_Rmax = MyUtil.toPrecision((0.8*(max_range_exp_4)*Input.cube_4pi*Input.kB*Input.T0_K*1000000*1000000)/(0.001*Input.loss_linear*(wavelength_exp_2)*Input.Num_Virt_Ant*Input.Chirp_duration*Input.Number_of_chirps),6);
        Input.Rmax_RCS_desired =MyUtil.toPrecision(Math.sqrt(Math.sqrt((0.001*Input.RCS_desired*Input.loss_linear*(wavelength_exp_2)*
            Input.Num_Virt_Ant*Input.Chirp_duration*Input.Number_of_chirps)/(0.8*Input.cube_4pi*Input.kB*Input.T0_K*1000000*1000000))),3);
        
        Input.Single_chirp_time = MyUtil.toPrecision(Input.Total_BW+Input.Inter_chirp_duration,2);
        
        if (Input.subprofile_type != 'best_vel_res') {
            Input.v_max_high = MyUtil.toFloor((Input.lightSpeed*1000)/(4*Input.Frequency_band*(Input.Chirp_duration+Input.Min_Interchirp_dur)*Input.Number_of_TX), 2);
            Input.v_max_low = MyUtil.toCeil((Input.lightSpeed*1000)/(4*Input.Frequency_band*(Input.Chirp_duration+Input.max_inter_chirp_duration)*Input.Number_of_TX), 2);
        } else {
            Input.v_max_high = Input.Radial_velocity_Resolution*Input.max_number_of_chirps/(2*Input.Number_of_TX); // VR sheet
            Input.v_max_low = Input.Radial_velocity_Resolution*N_fft2d_lo/2; // VR sheet
        }
        
        if (Input.subprofile_type == 'best_range_res' || Input.subprofile_type == 'best_range' ) { // or best range
            radialVelocityConstraints1(Input.v_max_low, Input.v_max_high, 0.01);//RR, best range
        } else {
            radialVelocityConstraints2(Input.v_max_low, Input.v_max_high, N_fft2d_lo, Input.max_number_of_chirps/Input.Number_of_TX);
        }
        
        // raidal velocity resolution constraints
        // radial_vel_res = max_radial_vel/ (N_fft2d/2) = max_radial_vel/ (N_chirps/(2*Tx)) = max_radial_vel*2*Tx/N_chirps
        // N_chirps = N_fft2d * Tx
        Input.vel_res_high = MyUtil.toCeil(Input.Maximum_radial_velocity *2/N_fft2d_lo, 2);
        Input.vel_res_low = MyUtil.toCeil(Input.Maximum_radial_velocity*2*Input.Number_of_TX/Input.max_number_of_chirps, 2);
        
        if (Input.subprofile_type == 'best_range_res' || Input.subprofile_type == 'best_range' ) {
            velocityResolutionConstraints1(Input.max_number_of_chirps, Input.Number_of_TX, N_fft2d_lo, Input.Maximum_radial_velocity, Input.Doppler_FFT_size);//RR, best range
            var valueN2d = parseInt(templateObj.$.ti_widget_droplist_radial_vel_resolution.selectedValue, 10);
            if (isNaN(valueN2d))
            {
            } else {
                Input.N_fft2d = valueN2d;
            }
            if (Input.N_fft2d) { // RR, best range
                // radial velocity resolutoin derived values
                Input.Doppler_FFT_size = Input.N_fft2d;
                Input.Number_of_chirps = Input.N_fft2d * Input.Number_of_TX;
                Input.Radial_velocity_Resolution = MyUtil.toCeil(Input.Maximum_radial_velocity / (Input.N_fft2d/2), 2);
            } 
        } else if (Input.subprofile_type == 'best_vel_res') {
            //radial_velocity_resolution
            velocityResolutionConstraints2(Input.Radial_velocity_Resolution);
        }
        
        //TODO?
        brief(Input);
    };
    
    var brief = function(Input) {
        //templateObj.$.ti_widget_input_range_res_sel.value = Input.Range_Resolution;
        templateObj.$.ti_widget_input_range_res_sel.label = Input.Range_Resolution;
        templateObj.$.ti_widget_input_max_range_sel.label = Input.Maximum_range;
        templateObj.$.ti_widget_input_max_radial_vel_sel.label = Input.Maximum_radial_velocity;
        templateObj.$.ti_widget_input_radial_vel_res_sel.label = Input.Radial_velocity_Resolution;
        templateObj.$.ti_widget_value_rcs_rmax.label = Input.RCS_Rmax;
        templateObj.$.ti_widget_value_rmax_rcs_desired.label = Input.Rmax_RCS_desired;
        templateObj.$.ti_widget_input_frame_rate.label = Input.Frame_Rate;
    
    };
    
    // takes uint16 version number and converts to 0xabcd
    var getVersionString = function(verUint16) {
        var hexStr = Number(verUint16).toString(16); //convert to hec
        hexStr = "0000".substr(0, 4 - hexStr.length) + hexStr; //make width=4 by adding zeros
        hexStr = hexStr.substr(0,2) + '.' + hexStr.substr(2,2); //separate into major/minor
        return hexStr;
    }
    
    var generate_ChannelCfg = function(Input,P) {
        if (Input.Number_of_RX ==4) P.channelCfg.rxChannelEn = 15;
        else if (Input.Number_of_RX==3) P.channelCfg.rxChannelEn = 7;
        else if (Input.Number_of_RX==2) P.channelCfg.rxChannelEn = 3;
        else if (Input.Number_of_RX==1) P.channelCfg.rxChannelEn = 2;
        else P.channelCfg.rxChannelEn = 0;
        //P.channelCfg.txChannelEn=IF(Number_of_TX=3,7,IF(Number_of_TX=2,5,IF(Number_of_TX=1,1,0)))
        if (Input.platform == Platform.xWR14xx) {
            if (Input.Number_of_TX ==3) P.channelCfg.txChannelEn = 7;
            else if (Input.Number_of_TX==2) P.channelCfg.txChannelEn = 5;
            else if (Input.Number_of_TX==1) P.channelCfg.txChannelEn = 1;
            else P.channelCfg.txChannelEn = 0;
        } else if (Input.platform == Platform.xWR16xx) {
            if (Input.Number_of_TX==2) P.channelCfg.txChannelEn = 3;
            else if (Input.Number_of_TX==1) P.channelCfg.txChannelEn = 1;
            else P.channelCfg.txChannelEn = 0;
        } else {
            P.channelCfg.txChannelEn = 0;
        }
        
        P.channelCfg.cascading = 0;
        P.lines.push(['channelCfg', P.channelCfg.rxChannelEn, P.channelCfg.txChannelEn, P.channelCfg.cascading].join(' '));
    }
    
    var generate_adcCfg = function(Input,P) {
        P.adcCfg.numADCBits = 2; //=IF(ADC_bits=16,2,"NA")
        P.adcCfg.adcOutputFmt = Input.ADC_samples_type==2 ? 1 : 0; //=IF(ADC_samples_type=2,1,0)
        P.adcCfg.justification = 0;//TODO remove
        P.lines.push(['adcCfg', P.adcCfg.numADCBits, P.adcCfg.adcOutputFmt].join(' '));
    }
    
    var generate_adcbufCfg = function(Input,P) {
        P.dataFmt.rxChannelEn = P.channelCfg.rxChannelEn;
        P.dataFmt.adcOutputFmt = Input.ADC_samples_type==2 ? 0 : 1;//=IF(ADC_samples_type=2,0,1)
        if (Input.platform == Platform.xWR16xx) {
            P.dataFmt.SampleSwap = 0;
            P.dataFmt.ChanInterleave = 1;
        } else {
            P.dataFmt.SampleSwap = 1;
            P.dataFmt.ChanInterleave = 0;
        }
        P.dataFmt.chirpThreshold = Input.chirps_per_interrupt;
        if ((Input.platform == Platform.xWR16xx) && (Input.sdkVersionUint16 >= 0x0101))
        {
            P.lines.push(['adcbufCfg -1', P.dataFmt.adcOutputFmt, P.dataFmt.SampleSwap, P.dataFmt.ChanInterleave, P.dataFmt.chirpThreshold].join(' '));
        }
        else
        {
            P.lines.push(['adcbufCfg', P.dataFmt.adcOutputFmt, P.dataFmt.SampleSwap, P.dataFmt.ChanInterleave, P.dataFmt.chirpThreshold].join(' '));
        }
    }
    
    var generate_profileCfg = function(Input,P) {
        P.profileCfg.profileId = 0;
        P.profileCfg.startFreq = Input.Frequency_band;
        P.profileCfg.idleTime = Input.Inter_chirp_duration;
        P.profileCfg.adcStartTime = Input.Chirp_Start_Time;
        P.profileCfg.rampEndTime = Input.Chirp_duration;
        P.profileCfg.txOutPower = 0;
        P.profileCfg.txPhaseShifter = 0;
        P.profileCfg.freqSlopeConst = Input.Ramp_Slope;
        P.profileCfg.txStartTime = 1;
        P.profileCfg.numAdcSamples = Input.Num_ADC_Samples;
        P.profileCfg.digOutSampleRate = Input.ADC_Sampling_Rate*1000;
        P.profileCfg.hpfCornerFreq1 = 0;
        P.profileCfg.hpfCornerFreq2 = 0;
        P.profileCfg.rxGain = 30;
        P.lines.push(['profileCfg', P.profileCfg.profileId, P.profileCfg.startFreq, P.profileCfg.idleTime, P.profileCfg.adcStartTime, P.profileCfg.rampEndTime,
                    P.profileCfg.txOutPower, P.profileCfg.txPhaseShifter, P.profileCfg.freqSlopeConst, P.profileCfg.txStartTime, P.profileCfg.numAdcSamples,
                    P.profileCfg.digOutSampleRate, P.profileCfg.hpfCornerFreq1, P.profileCfg.hpfCornerFreq2, P.profileCfg.rxGain].join(' '));
    }
    
    var generate_chirpCfg = function(Input,P) {
        var chirpCfg = {}; P.chirpCfg.push(chirpCfg);
        chirpCfg.startIdx = 0;
        chirpCfg.endIdx = 0;
        chirpCfg.profileId = 0;
        chirpCfg.startFreq = 0;
        chirpCfg.freqSlopeVar = 0;
        chirpCfg.idleTime = 0;
        chirpCfg.adcStartTime = 0;
        //chirpCfg.txEnable = 1;
        if (Input.platform == Platform.xWR14xx) {
            if (Input.Number_of_TX ==3) chirpCfg.txEnable = 1;
            else if (Input.Number_of_TX==2) chirpCfg.txEnable = 1;
            else chirpCfg.txEnable = 1;
        } else if (Input.platform == Platform.xWR16xx) {
            if (Input.Number_of_TX==2) chirpCfg.txEnable = 1;
            else chirpCfg.txEnable = 1;
        } else {
            chirpCfg.txEnable = 0;
        }

        chirpCfg = {}; P.chirpCfg.push(chirpCfg);
        chirpCfg.startIdx = 1;
        chirpCfg.endIdx = 1;
        chirpCfg.profileId = 0;
        chirpCfg.startFreq = 0;
        chirpCfg.freqSlopeVar = 0;
        chirpCfg.idleTime = 0;
        chirpCfg.adcStartTime = 0;
        if (Input.platform == Platform.xWR14xx) {
            if (Input.Number_of_TX ==3) chirpCfg.txEnable = 4;
            else if (Input.Number_of_TX==2) chirpCfg.txEnable = 4;
            else chirpCfg.txEnable = 0;
        } else if (Input.platform == Platform.xWR16xx) {
            if (Input.Number_of_TX==2) chirpCfg.txEnable = 2;
            else chirpCfg.txEnable = 0;
        } else {
            chirpCfg.txEnable = 0;
        }

        if (Input.platform == Platform.xWR14xx && Input.Number_of_TX ==3) { // TODO 3D case
            chirpCfg = {}; P.chirpCfg.push(chirpCfg);
            chirpCfg.startIdx = 2;
            chirpCfg.endIdx = 2;
            chirpCfg.profileId = 0;
            chirpCfg.startFreq = 0;
            chirpCfg.freqSlopeVar = 0;
            chirpCfg.idleTime = 0;
            chirpCfg.adcStartTime = 0;
            chirpCfg.txEnable = 2;
        }
        
        for (var idx=0; idx<P.chirpCfg.length; idx++) {
            chirpCfg = P.chirpCfg[idx];
            P.lines.push(['chirpCfg', chirpCfg.startIdx, chirpCfg.endIdx, chirpCfg.profileId, chirpCfg.startFreq, chirpCfg.freqSlopeVar,
                        chirpCfg.idleTime, chirpCfg.adcStartTime, chirpCfg.txEnable].join(' '));
        }
    }
    
    var generate_frameCfg = function(Input,P) {
        P.frameCfg.chirpStartIdx = 0;
        P.frameCfg.chirpEndIdx = Input.Number_of_TX-1;
        P.frameCfg.numLoops = Input.Number_of_chirps/(P.frameCfg.chirpEndIdx - P.frameCfg.chirpStartIdx + 1);
        P.frameCfg.numFrames = 0;
        P.frameCfg.framePeriodicity = Input.Frame_duration;
        P.frameCfg.triggerSelect = 1;
        P.frameCfg.frameTriggerDelay = 0;
        P.lines.push(['frameCfg', P.frameCfg.chirpStartIdx, P.frameCfg.chirpEndIdx, P.frameCfg.numLoops, P.frameCfg.numFrames,
                    P.frameCfg.framePeriodicity, P.frameCfg.triggerSelect, P.frameCfg.frameTriggerDelay].join(' '));
    }
    
    var generate_guiMonitorCfg = function(Input,P) {
        P.guiMonitor.detectedObjects = templateObj.$.ti_widget_checkbox_scatter_plot.checked ? 1 : 0;
        P.guiMonitor.logMagRange = templateObj.$.ti_widget_checkbox_range_profile.checked ? 1 : 0;
        P.guiMonitor.noiseProfile = templateObj.$.ti_widget_checkbox_noise_profile.checked ? 1 : 0;
        P.guiMonitor.rangeAzimuthHeatMap = templateObj.$.ti_widget_checkbox_azimuth_heatmap.checked ? 1 : 0;
        P.guiMonitor.rangeDopplerHeatMap = templateObj.$.ti_widget_checkbox_doppler_heatmap.checked ? 1 : 0;
        P.guiMonitor.statsInfo = templateObj.$.ti_widget_checkbox_statistics.checked ? 1 : 0;
        if ((Input.platform == Platform.xWR16xx) && (Input.sdkVersionUint16 >= 0x0101))
        {
            P.lines.push(['guiMonitor -1', P.guiMonitor.detectedObjects, P.guiMonitor.logMagRange, P.guiMonitor.noiseProfile,
                        P.guiMonitor.rangeAzimuthHeatMap, P.guiMonitor.rangeDopplerHeatMap, P.guiMonitor.statsInfo].join(' '));
        }                
        else
        {
            P.lines.push(['guiMonitor', P.guiMonitor.detectedObjects, P.guiMonitor.logMagRange, P.guiMonitor.noiseProfile,
                        P.guiMonitor.rangeAzimuthHeatMap, P.guiMonitor.rangeDopplerHeatMap, P.guiMonitor.statsInfo].join(' '));
        }
    }
    
    var generate_cfarCfg = function(Input,P) {
        var cfarCfg = {}; P.cfarRangeCfg = cfarCfg;
        if (Input.platform == Platform.xWR16xx) {
            cfarCfg.avgMode = 0;    
        } else {
            cfarCfg.avgMode = 2;
        }
        cfarCfg.noiseAvgWindowLength = 8;
        cfarCfg.guardLength = 4;
        if (Input.platform == Platform.xWR16xx) {
            cfarCfg.noiseSumDivisorAsShift = 4;
        } else {
            cfarCfg.noiseSumDivisorAsShift = 3;
        }
        cfarCfg.cyclicMode = 0;
        cfarCfg.thresholdScale = convertSensitivitydBToLinear(Input.Range_Sensitivity,Input.platform,Input.Num_Virt_Ant);
        if ((Input.platform == Platform.xWR16xx) && (Input.sdkVersionUint16 >= 0x0101))
        {
            P.lines.push(['cfarCfg -1 0', cfarCfg.avgMode, cfarCfg.noiseAvgWindowLength, cfarCfg.guardLength, cfarCfg.noiseSumDivisorAsShift,
                        cfarCfg.cyclicMode, cfarCfg.thresholdScale].join(' '));
        }                
        else
        {
            P.lines.push(['cfarCfg 0', cfarCfg.avgMode, cfarCfg.noiseAvgWindowLength, cfarCfg.guardLength, cfarCfg.noiseSumDivisorAsShift,
                        cfarCfg.cyclicMode, cfarCfg.thresholdScale].join(' '));
        }                
        
        //CFAR doppler only supported in xWR16xx
        if (Input.platform == Platform.xWR16xx) 
        {
            cfarCfg = {}; P.cfarDopplerCfg = cfarCfg;
            cfarCfg.avgMode = 0;
            // reduce the window and guard length for smaller FFT
            if (Input.Doppler_FFT_size==16){
                cfarCfg.noiseAvgWindowLength = 4;
                cfarCfg.guardLength = 2;
                cfarCfg.noiseSumDivisorAsShift = 3;
            } else {
                cfarCfg.noiseAvgWindowLength = 8;
                cfarCfg.guardLength = 4;
                cfarCfg.noiseSumDivisorAsShift = 4;
            }
            cfarCfg.cyclicMode = 0;
            cfarCfg.thresholdScale = convertSensitivitydBToLinear(Input.Doppler_Sensitivity,Input.platform,Input.Num_Virt_Ant);
            if (Input.sdkVersionUint16 >= 0x0101)
            {
                P.lines.push(['cfarCfg -1 1', cfarCfg.avgMode, cfarCfg.noiseAvgWindowLength, cfarCfg.guardLength, cfarCfg.noiseSumDivisorAsShift,
                            cfarCfg.cyclicMode, cfarCfg.thresholdScale].join(' '));
            }                
            else
            {
                P.lines.push(['cfarCfg 1', cfarCfg.avgMode, cfarCfg.noiseAvgWindowLength, cfarCfg.guardLength, cfarCfg.noiseSumDivisorAsShift,
                            cfarCfg.cyclicMode, cfarCfg.thresholdScale].join(' '));
            }
        }
    }
    
    var generate_peakGroupingCfg = function(Input,P) {
        var peakGrouping = {};
        peakGrouping.groupingMode = 1;
        peakGrouping.rangeDimEn = templateObj.$.ti_widget_checkbox_grouppeak_rangedir.checked ? 1 : 0; 
        peakGrouping.dopplerDimEn = templateObj.$.ti_widget_checkbox_grouppeak_dopplerdir.checked ? 1 : 0; 
        peakGrouping.startRangeIdx = 1;
        if (Input.platform == Platform.xWR16xx) {
            peakGrouping.endRangeIdx = Input.Range_FFT_size-1; //MMWSDK-546
        } else {
            peakGrouping.endRangeIdx = Math.floor(0.9*Input.Range_FFT_size)-1; //MMWSDK-546
        }
        if ((Input.platform == Platform.xWR16xx) && (Input.sdkVersionUint16 >= 0x0101))
        {
            P.lines.push(['peakGrouping -1', peakGrouping.groupingMode, peakGrouping.rangeDimEn, peakGrouping.dopplerDimEn, peakGrouping.startRangeIdx,
                    peakGrouping.endRangeIdx].join(' '));
        }
        else        
        {
            P.lines.push(['peakGrouping', peakGrouping.groupingMode, peakGrouping.rangeDimEn, peakGrouping.dopplerDimEn, peakGrouping.startRangeIdx,
                    peakGrouping.endRangeIdx].join(' '));
        }
    }
    
    var generate_BFCfg = function(Input,P) {
        var multiObjBeamForming = {};
        multiObjBeamForming.enabled = 1;
        multiObjBeamForming.threshold = 0.5;
        if ((Input.platform == Platform.xWR16xx) && (Input.sdkVersionUint16 >= 0x0101))
        {
            P.lines.push(['multiObjBeamForming -1', multiObjBeamForming.enabled, multiObjBeamForming.threshold].join(' '));
        }
        else        
        {
            P.lines.push(['multiObjBeamForming', multiObjBeamForming.enabled, multiObjBeamForming.threshold].join(' '));
        }
        
    }
    
    var generate_clutterCfg = function(Input,P) {
        if (Input.sdkVersionUint16 >= 0x0101) {
            P.clutterRemoval.enabled = templateObj.$.ti_widget_checkbox_clutter_removal.checked ? 1 : 0;
            if (Input.platform == Platform.xWR16xx)
            {
                P.lines.push(['clutterRemoval -1', P.clutterRemoval.enabled].join(' '));
            }
            else
            {
                P.lines.push(['clutterRemoval', P.clutterRemoval.enabled].join(' '));
            }
        }
    }   
        
    var generate_DcRangeCfg = function(Input,P) {
        var calibDcRangeSig = {};
        calibDcRangeSig.enabled = 0;
        calibDcRangeSig.negativeBinIdx = -5;
        calibDcRangeSig.positiveBinIdx = 8;
        calibDcRangeSig.numAvgChirps = 256;
        
        if ((Input.platform == Platform.xWR16xx) && (Input.sdkVersionUint16 >= 0x0101))
        {
            P.lines.push(['calibDcRangeSig -1', calibDcRangeSig.enabled, calibDcRangeSig.negativeBinIdx, calibDcRangeSig.positiveBinIdx, calibDcRangeSig.numAvgChirps].join(' '));
        }
        else
        {
            P.lines.push(['calibDcRangeSig', calibDcRangeSig.enabled, calibDcRangeSig.negativeBinIdx, calibDcRangeSig.positiveBinIdx, calibDcRangeSig.numAvgChirps].join(' '));
        }
    }
    
    var generate_extendedVeloCfg = function(Input,P) {
        var extendedMaxVelocity = {};
        extendedMaxVelocity.enabled = 0;
        if ((Input.platform == Platform.xWR16xx) && (Input.sdkVersionUint16 >= 0x0101))
        {
            P.lines.push(['extendedMaxVelocity -1', extendedMaxVelocity.enabled].join(' '));
        }
    }

    var generate_bpmCfg = function(Input,P) {
        var bpmCfg = {};
        bpmCfg.enabled = 0;
        bpmCfg.chirp0Idx = 0;
        bpmCfg.chirp1Idx = 1;
        if ((Input.platform == Platform.xWR16xx) && (Input.sdkVersionUint16 >= 0x0102))
        {
            P.lines.push(['bpmCfg -1', bpmCfg.enabled, bpmCfg.chirp0Idx, bpmCfg.chirp1Idx].join(' '));
        }
    }
    
    var generate_lvdsStreamCfg = function(Input,P) {
        var lvdsStreamCfg = {};
        lvdsStreamCfg.isHeaderEnabled = 0;
        lvdsStreamCfg.dataFmt = 0;
        lvdsStreamCfg.isSwEnabled = 0;
        
        if ((Input.platform == Platform.xWR16xx) && (Input.sdkVersionUint16 >= 0x0102))
        {
            P.lines.push(['lvdsStreamCfg -1', lvdsStreamCfg.isHeaderEnabled, lvdsStreamCfg.dataFmt, lvdsStreamCfg.isSwEnabled].join(' '));
        }
    }
    
    var generate_nearFieldCfg = function(Input,P) {
        var nearFieldCfg = {};
        nearFieldCfg.enabled = 0;
        nearFieldCfg.startRangeIdx = 0;
        nearFieldCfg.endRangeIdx = 0;
        if ((Input.platform == Platform.xWR16xx) && (Input.sdkVersionUint16 >= 0x0102))
        {
            P.lines.push(['nearFieldCfg -1', nearFieldCfg.enabled, nearFieldCfg.startRangeIdx, 
                         nearFieldCfg.endRangeIdx].join(' '));
        }
    }
    
    var generate_compRangeBiasAndRxChanPhase = function(Input,P) {
        if (Input.sdkVersionUint16 >= 0x0101) {
            P.lines.push(templateObj.$.ti_widget_textbox_compensation.getText());
            //if (Input.platform == Platform.xWR16xx) {
            //    P.lines.push('compRangeBiasAndRxChanPhase 0.0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0');
            //} else {
            //    P.lines.push('compRangeBiasAndRxChanPhase 0.0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0');
            //}       
        }
    }
    
    var generate_measureRangeBiasAndRxChanPhase = function(Input,P) {
        if (Input.sdkVersionUint16 >= 0x0101) {
            P.lines.push('measureRangeBiasAndRxChanPhase 0 1.5 0.2');       
        }
    }
    
    var generate_CQrxSat = function(Input,P) {
        var CQrxSatMon = {};
        var numPrimarySlices = 64;
        var primarySliceDuration = 4;
        var samplingTime;
        if (Input.sdkVersionUint16 >= 0x0102) {
        
            samplingTime = Input.Num_ADC_Samples / Input.ADC_Sampling_Rate;
            primarySliceDuration = Math.ceil(samplingTime/0.16/64);
            if (primarySliceDuration < 4){
                primarySliceDuration = 4;
            }
            
            numPrimarySlices = Math.ceil(samplingTime / (0.16 * primarySliceDuration));
            while(numPrimarySlices > 64){
                primarySliceDuration = primarySliceDuration + 1;
	            numPrimarySlices = Math.ceil(samplingTime / (0.16 * primarySliceDuration));            
            }
            
            CQrxSatMon.profileIndx = P.profileCfg.profileId;
            CQrxSatMon.satMonSel = 3;
            CQrxSatMon.primarySliceDuration = primarySliceDuration;
            CQrxSatMon.numSlices = numPrimarySlices * 2 - 1;
            CQrxSatMon.rxChannelMask = 0;
            
            P.lines.push(['CQRxSatMonitor', CQrxSatMon.profileIndx, CQrxSatMon.satMonSel,
		    			    CQrxSatMon.primarySliceDuration, CQrxSatMon.numSlices,
		    		       	CQrxSatMon.rxChannelMask].join(' '));
        }                    

    }

    var generate_CQSigImg = function(Input,P) {
        var CQSigImgMon = {};
		var numPrimarySlices = 64;
		var samplePerPriSlice = 4;

        if (Input.sdkVersionUint16 >= 0x0102) {
        
		    samplePerPriSlice = Math.ceil(Input.Num_ADC_Samples / 64 );
	        if (samplePerPriSlice < 4){
	            samplePerPriSlice = 4;
	        }
	        if(samplePerPriSlice % 2 != 0){
	            samplePerPriSlice = samplePerPriSlice + 1;
	        }
	        
            numPrimarySlices = Math.ceil(Input.Num_ADC_Samples / samplePerPriSlice);
            
            while(numPrimarySlices > 64){
                samplePerPriSlice = samplePerPriSlice + 1;
	            numPrimarySlices = Math.ceil(Input.Num_ADC_Samples / samplePerPriSlice);            
            }
            
            CQSigImgMon.profileIndx = P.profileCfg.profileId;
            CQSigImgMon.numSlices = numPrimarySlices * 2 - 1;
            CQSigImgMon.timeSliceNumSamples = samplePerPriSlice;
            
            P.lines.push(['CQSigImgMonitor', CQSigImgMon.profileIndx,
		    			    CQSigImgMon.numSlices,
		    		        CQSigImgMon.timeSliceNumSamples].join(' '));
        }                    
    }

    var generate_analogMon = function(Input,P) {
        var analogMon = {};
        if (Input.sdkVersionUint16 >= 0x0102) {
        
            analogMon.rxSatMonEn = 1;
            analogMon.sigImgMonEn = 1;
            
            P.lines.push(['analogMonitor',
		    		       analogMon.rxSatMonEn,
		    		       analogMon.sigImgMonEn].join(' '));
        }                   
    }
    var generateCfg = function() {
        var Input = this.Input;
        var P = {channelCfg: {}, adcCfg:{}, dataFmt:{}, profileCfg: {},
                 chirpCfg: [], frameCfg: {}, guiMonitor: {}, clutterRemoval: {}, lines: [] };
                 
        P.lines.push('% ***************************************************************');
        
        P.lines.push(['% Created for SDK ver',getVersionString(Input.sdkVersionUint16)].join(':'));
        P.lines.push(['% Created using Visualizer ver',visualizerVersion].join(':'));
        P.lines.push(['% Frequency',Input.Frequency_band].join(':'));
        P.lines.push(['% Platform',Input.platform].join(':'));
        P.lines.push(['% Scene Classifier',Input.subprofile_type].join(':'));
        P.lines.push(['% Azimuth Resolution(deg)',Input.Azimuth_Resolution].join(':'));
        P.lines.push(['% Range Resolution(m)',Input.Range_Resolution].join(':'));
        P.lines.push(['% Maximum unambiguous Range(m)',Input.Maximum_range].join(':'));
        P.lines.push(['% Maximum Radial Velocity(m/s)',Input.Maximum_radial_velocity].join(':'));
        P.lines.push(['% Radial velocity resolution(m/s)',Input.Radial_velocity_Resolution].join(':'));
        P.lines.push(['% Frame Duration(msec)',Input.Frame_duration].join(':'));
        P.lines.push(['% Range Detection Threshold (dB)',Input.Range_Sensitivity].join(':'));
        if (Input.platform == Platform.xWR16xx) P.lines.push(['% Doppler Detection Threshold (dB)',Input.Doppler_Sensitivity].join(':'));
        P.lines.push(['% Range Peak Grouping',templateObj.$.ti_widget_checkbox_grouppeak_rangedir.checked ? 'enabled' : 'disabled'].join(':'));
        P.lines.push(['% Doppler Peak Grouping',templateObj.$.ti_widget_checkbox_grouppeak_dopplerdir.checked ? 'enabled' : 'disabled'].join(':'));
        P.lines.push(['% Static clutter removal',templateObj.$.ti_widget_checkbox_clutter_removal.checked ? 'enabled' : 'disabled'].join(':'));
        
        P.lines.push('% ***************************************************************');
        
        P.lines.push('sensorStop');
        P.lines.push('flushCfg');
        P.lines.push('dfeDataOutputMode 1');
    
        // channelCfg
        generate_ChannelCfg(Input,P);
        
        // adcCfg
        generate_adcCfg(Input,P);
        
        // dataFmt (adcbufCfg)
        generate_adcbufCfg(Input,P);
                
        // profileCfg
        generate_profileCfg(Input,P);
        
        // chirpCfg 
        generate_chirpCfg(Input,P);
        
        // frameCfg
        generate_frameCfg(Input,P);
        
        // guiMonitor
        generate_guiMonitorCfg(Input,P);
        
        // cfarCfg, cfarRangeCfg, cfarDopplerCfg
        generate_cfarCfg(Input,P);
        
        // peakGrouping
        generate_peakGroupingCfg(Input,P);

        // multiObjBeamForming
        generate_BFCfg(Input,P);
        
        //Static clutter removal
        generate_clutterCfg(Input,P);

        //always disable calibDcRangeSig and fill in defaults (needed as they are checked by demo)
        generate_DcRangeCfg(Input,P);
        
        //always disable extendedMaxVelocity
        generate_extendedVeloCfg(Input,P);
        
        //always disable BPM
        generate_bpmCfg(Input,P);
        
        //always disable LVDS streaming
        generate_lvdsStreamCfg(Input,P);
        
        //always disable nearField
        generate_nearFieldCfg(Input,P);
        
        // compensate range and angle based on input
        generate_compRangeBiasAndRxChanPhase(Input,P);
        
        // disable always
        generate_measureRangeBiasAndRxChanPhase(Input,P);
        
        // CQ rxSaturation
        generate_CQrxSat(Input,P);

        // CQ Signal Image band monitor
	    generate_CQSigImg(Input,P);

    	// Analog monitor
    	generate_analogMon(Input,P);

        P.lines.push('sensorStart');
        return P;
    };

    mmWaveInput.prototype.init = init;
    mmWaveInput.prototype.updateInput = updateInput;
    mmWaveInput.prototype.generateCfg = generateCfg;
    mmWaveInput.prototype.Platform = Platform;
    mmWaveInput.prototype.isRR = isRR;
    mmWaveInput.prototype.isVR = isVR;
    mmWaveInput.prototype.isBestRange = isBestRange;
    mmWaveInput.prototype.setDefaultRangeResConfig = setDefaultRangeResConfig;
    mmWaveInput.prototype.setDefaultVelResConfig = setDefaultVelResConfig;
    mmWaveInput.prototype.setDefaultRangeConfig = setDefaultRangeConfig;

    // export as AMD/CommonJS module or global variable
    if (typeof define === 'function' && define.amd) define('mmWaveInput', function () { return mmWaveInput; });
    else if (typeof module !== 'undefined') module.exports = mmWaveInput;
    else if (typeof self !== 'undefined') self.mmWaveInput = mmWaveInput;
    else window.mmWaveInput = mmWaveInput;

})();


