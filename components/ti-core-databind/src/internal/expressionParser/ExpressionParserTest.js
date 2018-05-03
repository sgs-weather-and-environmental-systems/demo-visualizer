/*******************************************************************************
 * Copyright (c) 2013-2014 Texas Instruments and others All rights reserved.
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v1.0 which accompanies this distribution,
 * and is available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: Paul Gingrich - Initial API and implementation
 ******************************************************************************/
var gc = gc || {};
gc.databind = gc.databind || {};
gc.databind.internal = gc.databind.internal || {};
gc.databind.internal.expressionParser = gc.databind.internal.expressionParser || {};

(function()
{
    var valueChanged;
    var ValueChangedListener = function()
    {
    };

    ValueChangedListener.prototype = new gc.databind.IChangedListener();

    ValueChangedListener.prototype.onValueChanged = function(oldValue, newValue, progress)
    {
        valueChanged = true;
    };

    var statusChanged;

    var ExpressionParserTest = function()
    {
    };
    
    ExpressionParserTest.prototype = new gc.databind.internal.AbstractUnitTestSuite("Expression Parser Tests");
    
    var TestModel = function()
    {
        gc.databind.AbstractBindFactory.call(this);
        this.init();
    };

    TestModel.prototype = new gc.databind.AbstractBindFactory("test");

    TestModel.prototype.createNewBind = function(name)
    {
        if (this.hasOwnProperty(name))
        {
            var data = this[name];
            if (data instanceof Array || typeof data === "object")
            {
                return new gc.databind.VariableLookupBindValue(data);
            }
            return new gc.databind.VariableBindValue(data);
        }
        else
        {
            return undefined;
        }
    };

    TestModel.prototype.addBinding = function(name, value)
    {
        this[name] = value;
    };
    
    var test;

    var getBinding = function(expression)
    {
        var binding = gc.databind.registry.getBinding(expression);
        test.assertNotNull(binding);
        test.assertTrue(binding instanceof gc.databind.IBindValue || binding instanceof gc.databind.AbstractBind);
        return binding;
    };

    var isValueChanged = function(bindExpression, leafBinding)
    {
        valueChanged = false;

        try
        {
            var bind1 = getBinding(bindExpression);
            var bind2 = getBinding(leafBinding);

            var listener = new ValueChangedListener();

            bind1.addChangedListener(listener);
            bind2.notifyChangedListeners();
        }
        catch (e)
        {
            test.fail(e.toString());
        }

        return valueChanged;
    };

    var BindListener = function()
    {
    };

    BindListener.prototype = new gc.databind.IStatusListener();

    BindListener.prototype.onStatusChanged = function(status)
    {
        statusChanged = true;
    };

    var isStatusChanged = function(bindExpression, leafBinding)
    {
        statusChanged = false;

        try
        {
            var bind1 = getBinding(bindExpression);
            var bind2 = getBinding(leafBinding);

            var listener = new BindListener();

            bind1.addStatusListener(listener);
            bind2.notifyStatusChanged(bind2.getStatus());
        }
        catch (e)
        {
            test.fail(e.toString());
        }

        return statusChanged;
    };

    var evaluate = function(result, expression, nBindings)
    {
        try
        {
            var bindingCount = gc.databind.registry.getBindingCount();
            test.start(expression);

            var binding = getBinding(expression);
            // ensure that if fEvents is defined, it is at the top level
            test.assertEquals(binding.hasOwnProperty('fEvents'), binding.fEvents !== undefined); 

            var value = binding.getValue();
            if (value === null || value === undefined)
            {
                if (result === null)
                {
                    test.assertNull(binding.getStatus());
                }
                else
                {
                    var status = binding.getStatus();
                    test.assertNotNull(status);
                    test.assertEquals(result, status.getMessage());
                }
            }
            else if (result instanceof Array && value instanceof Array)
            {
                test.assertArrayEquals(result, value);
            }
            else
            {
                test.assertEquals(result, value);
            }

            test.assertEquals(nBindings, gc.databind.registry.getBindingCount() - bindingCount);
        }
        catch (e)
        {
            test.assertEquals(result, e.toString());
        }
    };

    ExpressionParserTest.prototype.run = function()
    {
        test = this;
        
        var A = 1;
        var B = 263;
        var C = 19;
        var D = -2343;
        var X = 11883.54834;
        var Y = -1893.94943;
        var S = "test with a space";
        var BOOL = true;
        var hex = "0xBABE";
        var ARRAY =
        [
            1.0, -3, "test",
            [
                true, false
            ]
        ];
        var M =
        {
            name : "value"
        };
        var L =
        [
            A, B, C
        ];
        var N = null;
        
        var Q = function(value, q) 
        {
            return value / Math.pow(2, q);
        };
        
        var Inverse_Q = function(value, q)
        {
            return Math.round(value * Math.pow(2, q));
        };
        var model = new TestModel();
        gc.databind.registry.registerModel(model, true, 'testAlias');

        model.addBinding("A", A);
        model.addBinding("B", B);
        model.addBinding("C", C);
        model.addBinding("D", D);

        model.addBinding("X", X);
        model.addBinding("Y", Y);

        model.addBinding("S", S);
        model.addBinding("hex", hex);

        model.addBinding("BOOL", BOOL);
        model.addBinding("ARRAY", ARRAY);

        model.addBinding("L", L);
        model.addBinding("M", M);
        model.addBinding("N", N);

        evaluate(Number(A + A), "A+A", 2);
        evaluate(Number(A + B), "A+B", 2);
        evaluate(Number(A + C), "A+C", 2);
        evaluate(Number(A + D), "A+D", 2);
        evaluate(Number(A + X), "A+X", 2);
        evaluate(Number(A + Y), "A+Y", 2);
        evaluate(String(A + S), "A+S", 2);
        evaluate(A + BOOL, "A+BOOL", 2);

        evaluate(Number(B - A), "B-A", 1);
        evaluate(Number(B - B), "B-B", 1);
        evaluate(Number(B - C), "B-C", 1);
        evaluate(Number(B - D), "B-D", 1);
        evaluate(Number(B - X), "B-X", 1);
        evaluate(Number(B - Y), "B-Y", 1);
        evaluate("Operator '-' does not support string types", "B-S", 1);
        evaluate(B - BOOL, "B-BOOL", 1);

        evaluate(Number(C * A), "C*A", 1);
        evaluate(Number(C * B), "C*B", 1);
        evaluate(Number(C * C), "C*C", 1);
        evaluate(Number(C * D), "C*D", 1);
        evaluate(Number(C * X), "C*X", 1);
        evaluate(Number(C * Y), "C*Y", 1);
        evaluate("Operator '*' does not support string types", "C*S", 1);
        evaluate(C * BOOL, "C*BOOL", 1);

        evaluate(Number(D / A), "D/A", 1);
        evaluate(Number(D / B), "D/B", 1);
        evaluate(Number(D / C), "D/C", 1);
        evaluate(Number(D / D), "D/D", 1);
        evaluate(Number(D / X), "D/X", 1);
        evaluate(Number(D / Y), "D/Y", 1);
        evaluate("Operator '/' does not support string types", "D/S", 1);
        evaluate(D / BOOL, "D/BOOL", 1);

        evaluate(Number(X % A), "X%A", 1);
        evaluate(Number(X % B), "X%B", 1);
        evaluate(Number(X % C), "X%C", 1);
        evaluate(Number(X % D), "X%D", 1);
        evaluate(Number(X % X), "X%X", 1);
        evaluate(Number(X % Y), "X%Y", 1);
        evaluate("Operator '%' does not support string types", "X%S", 1);
        evaluate(X % BOOL, "X%BOOL", 1);

        evaluate(Number(Y + A), "Y+A", 1);
        evaluate(Number(Y + B), "Y+B", 1);
        evaluate(Number(Y + C), "Y+C", 1);
        evaluate(Number(Y + D), "Y+D", 1);
        evaluate(Number(Y + X), "Y+X", 1);
        evaluate(Number(Y + Y), "Y+Y", 1);
        evaluate(String(X + S), "X+S", 1);
        evaluate(X + BOOL, "X+BOOL", 1);

        evaluate(Boolean(true), "A==A", 1);
        evaluate(Boolean(A == B), "A==B", 1);
        evaluate(Boolean(A == C), "A==C", 1);
        evaluate(Boolean(A == D), "A==D", 1);
        evaluate(Boolean(A == X), "A==X", 1);
        evaluate(Boolean(A == Y), "A==Y", 1);
        evaluate(Boolean(A.toString() == S), "A==S", 1);
        evaluate(A == BOOL, "A==BOOL", 1);

        evaluate(Boolean(B != A), "B!=A", 1);
        evaluate(Boolean(false), "B!=B", 1);
        evaluate(Boolean(B != C), "B!=C", 1);
        evaluate(Boolean(B != D), "B!=D", 1);
        evaluate(Boolean(B != X), "B!=X", 1);
        evaluate(Boolean(B != Y), "B!=Y", 1);
        evaluate(Boolean(B.toString() != S), "B!=S", 1);
        evaluate(B != BOOL, "B!=BOOL", 1);

        evaluate(Boolean(C < A), "C<A", 1);
        evaluate(Boolean(C < B), "C<B", 1);
        evaluate(Boolean(false), "C<C", 1);
        evaluate(Boolean(C < D), "C<D", 1);
        evaluate(Boolean(C < X), "C<X", 1);
        evaluate(Boolean(C < Y), "C<Y", 1);
        evaluate(Boolean(C.toString() < S), "C<S", 1);
        evaluate(C < BOOL, "C<BOOL", 1);

        evaluate(Boolean(D > A), "D>A", 1);
        evaluate(Boolean(D > B), "D>B", 1);
        evaluate(Boolean(D > C), "D>C", 1);
        evaluate(Boolean(false), "D>D", 1);
        evaluate(Boolean(D > X), "D>X", 1);
        evaluate(Boolean(D > Y), "D>Y", 1);
        evaluate(Boolean(D.toString() > S), "D>S", 1);
        evaluate(D > BOOL, "D>BOOL", 1);

        evaluate(Boolean(X <= A), "X<=A", 1);
        evaluate(Boolean(X <= B), "X<=B", 1);
        evaluate(Boolean(X <= C), "X<=C", 1);
        evaluate(Boolean(X <= D), "X<=D", 1);
        evaluate(Boolean(true), "X<=X", 1);
        evaluate(Boolean(X <= Y), "X<=Y", 1);
        evaluate(Boolean(X.toString() <= S), "X<=S", 1);
        evaluate(X <= BOOL, "X<=BOOL", 1);

        evaluate(Boolean(Y >= A), "Y>=A", 1);
        evaluate(Boolean(Y >= B), "Y>=B", 1);
        evaluate(Boolean(Y >= C), "Y>=C", 1);
        evaluate(Boolean(Y >= D), "Y>=D", 1);
        evaluate(Boolean(Y >= X), "Y>=X", 1);
        evaluate(Boolean(true), "Y>=Y", 1);
        evaluate(Boolean(Y.toString() >= S), "Y>=S", 1);
        evaluate(Y >= BOOL, "Y>=BOOL", 1);

        evaluate(S == A, "S==A", 1);
        evaluate(S == B, "S==B", 1);
        evaluate(S == C, "S==C", 1);
        evaluate(S == D, "S==D", 1);
        evaluate(S == X, "S==X", 1);
        evaluate(S == Y, "S==Y", 1);
        evaluate(Boolean(true), "S==S", 1);
        evaluate(Boolean(S == BOOL.toString()), "S==BOOL", 1);

        evaluate(BOOL != A, "BOOL!=A", 1);
        evaluate(BOOL != B, "BOOL!=B", 1);
        evaluate(BOOL != C, "BOOL!=C", 1);
        evaluate(BOOL != D, "BOOL!=D", 1);
        evaluate(BOOL != X, "BOOL!=X", 1);
        evaluate(BOOL != Y, "BOOL!=Y", 1);
        evaluate(Boolean(BOOL.toString() != S), "BOOL!=S", 1);
        evaluate(Boolean(false), "BOOL!=BOOL", 1);

        evaluate(BOOL && A != 0, "BOOL&&A", 1);
        evaluate(BOOL || B != 0, "BOOL||B", 1);
        evaluate(BOOL && C != 0, "BOOL&&C", 1);
        evaluate(BOOL || D != 0, "BOOL||D", 1);
        evaluate(BOOL && X != 0, "BOOL&&X", 1);
        evaluate(BOOL || Y != 0, "BOOL||Y", 1);
        evaluate("Operator '&&' does not support string types", "BOOL&&S", 1);
        evaluate(Boolean(BOOL), "BOOL||BOOL", 1);
        evaluate(Boolean(BOOL), "BOOL&&BOOL", 1);

        evaluate(Number(-A), "-A", 1);
        evaluate(Number(-B), "-B", 1);
        evaluate(Number(-C), "-C", 1);
        evaluate(Number(-D), "-D", 1);
        evaluate(Number(-X), "-X", 1);
        evaluate(Number(-Y), "-Y", 1);
        evaluate("Operator '-' does not support string types", "-S", 1);
        evaluate("Operator '-' does not support boolean types", "-BOOL", 1);

        evaluate(Number(~A), "~A", 1);
        evaluate(Number(~B), "~B", 1);
        evaluate(Number(~C), "~C", 1);
        evaluate(Number(~D), "~D", 1);
        evaluate(Number(~X), "~X", 1);
        evaluate(Number(~Y), "~Y", 1);
        evaluate("Operator '~' does not support string types", "~S", 1);
        evaluate("Operator '~' does not support boolean types", "~BOOL", 1);

        evaluate(!A, "!A", 1);
        evaluate(!B, "!B", 1);
        evaluate(!C, "!C", 1);
        evaluate(!D, "!D", 1);
        evaluate(!X, "!X", 1);
        evaluate(!Y, "!Y", 1);
        evaluate("Operator '!' does not support string types", "!S", 1);
        evaluate(Boolean(!BOOL), "!BOOL", 1);

        evaluate(34, "34", 1);
        evaluate(3.1415, "3.1415", 1);
        evaluate("test", "'test'", 1);
        evaluate(true, "true", 1);
        evaluate(false, "false", 1);
        evaluate(
        [
            "a", "b", "c"
        ], "[a,b,c]", 1);

        evaluate(
        [
            1, 2, 3, 4, 5
        ], "[1, 2, 3] + [ 4, 5] ", 3);
        evaluate(
        [
            1.0, 2.0, 3.3, 4.4, 5.0
        ], "[1, 2, 3.3] + [ 4.4, 5] ", 3);
        evaluate(
        [
            "a", "b", "3", "4", "'5'"
        ], "[a, b, 3] + [ 4, '5'] ", 3);
        evaluate(
        [
            true, false, true
        ], "[true,false ]+ true ", 2);

        evaluate(Number((A + B) - (((C * D) / X) % Y)), " (A + B) - (((C * D) / X) % Y)  ", 7);
        evaluate(Number(A + B - C * D / X % Y), " A + B - C * D / X % Y ", 3);
        evaluate(Number(A + (B - C) * ((D / X)) % Y), "A + (B - C) * ((D / X)) % Y ", 6);

        evaluate(String(A < B ? B <= C ? "test1" : "test2" : "test3"), "A<B?B<C?'test1':'test2':'test3'", 7);

        evaluate(ARRAY[0], "ARRAY[0]", 2);
        evaluate("The index -11 is out of bounds.  It must be between 0 and 3", "ARRAY[A-12]", 3);
        evaluate(ARRAY[2], "ARRAY['2']", 2);
        evaluate(ARRAY[0x3], " ARRAY [ 0x3 ] ", 2);
        evaluate((ARRAY[2 + 1])[1], "(ARRAY [ 2+1])[1]", 4);
        evaluate('Invalid identifier found: "1".  To be honest, I was not expecting it to begin with a number.', "(ARRAY [ 2+1]).1", 0);
        evaluate('Invalid identifier found: "1".  To be honest, I was not expecting it to begin with a number.', " ARRAY [ 2+1] . 1", 1);
        evaluate(ARRAY[0] +ARRAY [1], "ARRAY[0] +ARRAY [1]", 2);
        evaluate(ARRAY [0]+ ARRAY[2], "ARRAY [0]+ ARRAY[2]", 2);

        // test IBindProvider array lookups
        var g = 'g';
        var f =
        {
            g : g
        };
        var e =
        [
            null, null, f
        ];
        var d =
        {
            e : e
        };
        var c =
        {
            d : d
        };
        var b =
        {
            c : c
        };
        var aa =
        [
            null, b
        ];
        model.addBinding("a.a", aa);

        evaluate(String("g"), "a.a[1]['c'].d.e[2].g", 2);
        evaluate("The index value is null.", "a.a[N]", 2);
        evaluate("The index value is null.", "a.a[N][N].d.e[N].g", 1);
        evaluate("The index value is null.", "a.a[N][N].d.e[2].g", 1);
        evaluate("The index value is null.", "a.a[N]['c'].d.e[2].g", 1);
        evaluate("The index value is null.", "a.a[1]['c'].d.e[N].g", 1);
        evaluate("The index value is null.", "a.a[1][N].d.e[2].g", 1);
        evaluate("The index value is null.", "a.a[1][N].d.e[N].g", 1);

        // test null pointers, and array lookup error messages.
        evaluate(null, "N", 0);
        evaluate("The index -1 is out of bounds.  It must be between 0 and 3", "ARRAY[-1]", 2);
        evaluate("The index is not valid. Cannot convert 'jasper' to an integer.", "ARRAY['jasper']", 2);
        evaluate("The index value is null.", "ARRAY[N]", 1);
        evaluate("The index 'test' was not found.", "M['test']", 1);
        evaluate(String("value"), "M['name']", 2);
        evaluate("The index 4 is out of bounds.  It must be between 0 and 2", "L[0x4]", 2);
        evaluate("The index is not valid. Cannot convert 'test' to an integer.", "L['test']", 1);
        evaluate(Number(C), "L[2]", 1);
        evaluate(Number(B), "L[1]", 1);
        evaluate(Number(A), "L[0x0]", 2);

        // test status messages are cleared when values change
        evaluate("The index value is null.", "ARRAY[N]", 0);
        var NullBind = gc.databind.registry.getBinding('N');
        NullBind.setValue(Number(2));
        evaluate(ARRAY[2], "testAlias.ARRAY[N]", 1);
        evaluate(ARRAY[2], "test.ARRAY[N]", 1);
        evaluate(ARRAY[2], "ARRAY[N]", 0);
        evaluate("The index 2 is out of bounds.  It must be between 0 and 1", "a.a[N]", 0);
        NullBind.setValue(Number(1));
        evaluate(b, "a.a[N]", 0);

        // test escape caracters in literal strings
        evaluate(String("\"that's all folk's\\"), "'\"that\\'s all folk\\'s\\\\'", 1);
        evaluate(String("file:" + S + "/InterruptVectors_init.c"), "'file:' + S + '/InterruptVectors_init.c'", 4);

        evaluate(Math.PI, 'Math.PI', 1);
        evaluate(Math.PI, 'widget.Math.PI', 1);
        
        // test Q value conversion
        evaluate(Q(B, 24), "Q(B, 24)", 2);
        evaluate(Q(B, 24), "B.$q24", 1);

        // Hex conversions qualifiers
        evaluate('0x1', "A.$hex", 1);
        evaluate('0x0107', "B.$hex4", 1);
        evaluate('0x13', "C.$hex", 1);
        evaluate('0xFFFFF6D9', "D.$hex", 1);
        evaluate('0xF6D9', "D.$hex4", 1);
        evaluate('0x1', "BOOL.$hex", 1);
        evaluate('0xNaN', "S.$hex", 1);
        evaluate('0xBABE', "hex.$hex", 1);
        
        // Binary conversions
        evaluate('00001', "A.$binary5", 1);
        evaluate('00000111', "B.$BINARY8", 1);
        evaluate('10011', "C.$binary", 1);
        evaluate('11111111111111111111011011011001', "D.$binary", 1);
        evaluate('1', "BOOL.$binary", 1);
        evaluate('NaN', "S.$BinAry, 1");
        evaluate('1011101010111110', "hex.$binary", 1);
        
        // Decimal conversions
        evaluate('1.00000', "A.$DEC5", 1);
        evaluate('263.00000000', "B.$dec8", 1);
        evaluate('19', "C.$dec", 1);
        evaluate('-2343', "D.$dec", 1);
        evaluate('11883.55', "X.$dec2", 1);
        evaluate('-1893.949430', "Y.$dec6", 1);
        evaluate('1', "BOOL.$dec", 1);
        evaluate('NaN', "S.$dec", 1);
        evaluate((+hex).toFixed(0), "hex.$dec", 1);
        
        // Exponential conversions
        evaluate(A.toExponential(5), "A.$exp5", 1);
        evaluate(B.toExponential(8), "B.$exp8", 1);
        evaluate(C.toExponential(), "C.$exp", 1);
        evaluate(D.toExponential(), "D.$exp", 1);
        evaluate(X.toExponential(2), "X.$exp2", 1);
        evaluate(Y.toExponential(6), "Y.$exp6", 1);
        evaluate((+BOOL).toExponential(), "BOOL.$exp", 1);
        evaluate('NaN', "S.$exp", 1);
        evaluate((+hex).toExponential(0), "hex.$exp0", 1);

        // custom conversions
        gc.databind.registry.addDataFormatter('by', 'string', function(input, precision) { return "" + input + 'x' + precision; } );
        evaluate('1x3', "A.$by3", 1);
    };

    gc.databind.internal.TestSuites.add(new ExpressionParserTest());
}());
