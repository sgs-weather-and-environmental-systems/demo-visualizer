var gc = gc || {};

(function()
{
    var LOG_PACKETS = false;  // set true to turn on logging to the console of all packets sent and received.
    
    // packet types
    var COMMAND_PACKET = 1;
    var REPLY_PACKET = 2;
    var ERROR_PACKET = 3;
    var PAYLOAD_PACKET = 4;
    var INTERRUPT_PACKET = 5;

    // packet flags
    var FLAG_MOREDATA = 1;

    var PACKET_IDENTIFIER = 'T'.charCodeAt(0);

    var HID_RESERVED = 2; // packet bytes reserved by HID
    var PACKET_ID = 2;
    var PACKET_PEC = 3;
    var PACKET_PAYLOAD_LEN = 4;
    var PACKET_TYPE = 5;
    var PACKET_FLAGS = 6;
    var PACKET_SEQ_NUM = 7;
    var PACKET_STATUS = 8;
    var PACKET_COMMAND = 9;
    var PACKET_PAYLOAD = 10;

    var MAX_PACKET_SIZE = 64; // size, in bytes, of a USB packet
    var PACKET_HEADER_SIZE = PACKET_PAYLOAD - HID_RESERVED;
    var MAX_PAYLOAD = MAX_PACKET_SIZE - PACKET_HEADER_SIZE - HID_RESERVED;

    var Command =
    {
        Cmd_LoopPacket : 0, // 0x00
        Cmd_I2C_Control : 1, // 0x01
        Cmd_I2C_Write : 2, // 0x02
        Cmd_I2C_Read : 3, // 0x03
        Cmd_I2CRead_WithAddress : 4, // 0x04
        Cmd_GPIO_Write_Control : 5, // 0x05
        Cmd_GPIO_Write_States : 6, // 0x06
        Cmd_GPIO_Read_States : 7, // 0x07
        Cmd_SPI_Control : 8, // 0x08
        Cmd_SPI_WriteAndRead : 9, // 0x09
        Cmd_FirmwareVersion_Read : 10, // 0x0A
        Cmd_MSP430_WordWrite : 11, // 0x0B
        Cmd_MSP430_WordRead : 12, // 0x0C
        Cmd_MSP430_ByteWrite : 13, // 0x0D
        Cmd_MSP430_ByteRead : 14, // 0x0E
        Cmd_UART_Control : 15, // 0x0F
        Cmd_MSP430_MemoryWrite : 16, // 0x10
        Cmd_MSP430_MemoryRead : 17, // 0x11
        Cmd_UART_Write : 18, // 0x12
        Cmd_UART_SetMode : 19, // 0x13
        Cmd_UART_Read : 20, // 0x14
        Cmd_Local_I2C_Write : 21, // 0x15
        Cmd_PWM_Write_Control : 22, // 0x16
        Cmd_Power_WriteControl : 23, // 0x17
        Cmd_Power_ReadStatus : 24, // 0x18
        Cmd_ADC_Control : 25, // 0x19
        Cmd_ADC_ConvertAndRead : 26, // 0x1A
        Cmd_LED_Control : 27, // 0x1B
        Cmd_Clock_Control : 28, // 0x1C
        Cmd_FEC_Control : 29, // 0x1D
        Cmd_FEC_CountAndRead : 30, // 0x1E
        Cmd_Interrupt_Control : 31, // 0x1F
        Cmd_Interrupt_Received : 32, // 0x20
        Cmd_EasyScale_Control : 33, // 0x21
        Cmd_EasyScale_Write : 34, // 0x22
        Cmd_EasyScale_Read : 35, // 0x23
        Cmd_EasyScale_ACK_Received : 36, // 0x24
        Cmd_GPIO_SetPort : 37, // 0x25
        Cmd_GPIO_WritePort : 38, // 0x26
        Cmd_GPIO_ReadPort : 39, // 0x27
        Cmd_Reserved_40 : 40, // 0x28 Reserved for end-user command **
        Cmd_Reserved_41 : 41, // 0x29 Reserved for end-user command **
        Cmd_Reserved_42 : 42, // 0x2A Reserved for end-user command **
        Cmd_Reserved_43 : 43, // 0x2B Reserved for end-user command **
        Cmd_Reserved_44 : 44, // 0x2C Reserved for end-user command **
        Cmd_Reserved_45 : 45, // 0x2D Reserved for end-user command **
        Cmd_Reserved_46 : 46, // 0x2E Reserved for end-user command **
        Cmd_Reserved_47 : 47, // 0x2F Reserved for end-user command **
        Cmd_Reserved_48 : 48, // 0x30 Reserved for end-user command **
        Cmd_Reserved_49 : 49, // 0x31 Reserved for end-user command **
        Cmd_SMBUS_SendByte : 50, // 0x32
        Cmd_SMBUS_WriteByte : 51, // 0x33
        Cmd_SMBUS_WriteWord : 52, // 0x34
        Cmd_SMBUS_WriteBlock : 53, // 0x35
        Cmd_SMBUS_ReceiveByte : 54, // 0x36
        Cmd_SMBUS_ReadByte : 55, // 0x37
        Cmd_SMBUS_ReadWord : 56, // 0x38
        Cmd_SMBUS_ReadBlock : 57, // 0x39
        Cmd_SMBUS_ProcessCall : 58, // 0x3A
        Cmd_SMBUS_BWBRProcessCall : 59, // 0x3B
        Cmd_SMBUS_Control : 60, // 0x3C
        Cmd_SMBUS_GetEchoBuffer : 61, // 0x3D
        Cmd_RFFE_RegZeroWrite : 62, // 0x3E
        Cmd_RFFE_RegWrite : 63, // 0x3F
        Cmd_RFFE_ExtRegWrite : 64, // 0x40
        Cmd_RFFE_ExtRegWriteLong : 65, // 0x41
        Cmd_RFFE_RegRead : 66, // 0x42
        Cmd_RFFE_ExtRegRead : 67, // 0x43
        Cmd_RFFE_ExtRegReadLong : 68, // 0x44
        Cmd_OneWire_SetMode : 69, // 0x45
        Cmd_OneWire_PulseSetup : 70, // 0x46
        Cmd_OneWire_PulseWrite : 71, // 0x47
        Cmd_OneWire_SetState : 72, // 0x48
        Cmd_Reserved_73 : 73, // 0x49 **
        Cmd_Reserved_74 : 74, // 0x4A **
        Cmd_Reserved_75 : 75, // 0x4B **
        Cmd_Reserved_76 : 76, // 0x4C **
        Cmd_Reserved_77 : 77, // 0x4D **
        Cmd_Reserved_78 : 78, // 0x4E **
        Cmd_Reserved_79 : 79, // 0x4F **
        Cmd_Reserved_80 : 80, // 0x50 **
        Cmd_Reserved_81 : 81, // 0x51 **
        Cmd_Reserved_82 : 82, // 0x52 **
        Cmd_Reserved_83 : 83, // 0x53 **
        Cmd_Packet : 84, // 0x54
        Cmd_GPIO_SetCustomPort : 85, // 0x55
        Cmd_GPIO_WriteCustomPort : 86, // 0x56
        Cmd_GPIO_ReadCustomPort : 87, // 0x57
        Cmd_GPIO_WritePulse : 88, // 0x58
        Cmd_Reserved_89 : 89, // 0x59 **
        Cmd_Reserved_90 : 90, // 0x5A **
        Cmd_Reserved_91 : 91, // 0x5B **
        Cmd_Reserved_92 : 92, // 0x5C **
        Cmd_Reserved_93 : 93, // 0x5D **
        Cmd_Reserved_94 : 94, // 0x5E **
        Cmd_Reserved_95 : 95, // 0x5F **
        Cmd_I2C_BlkWriteBlkRead : 96, // 0x60
        Cmd_InvokeBSL : 97, // 0x61
        Cmd_FirmwareDebugMode : 98, // 0x62
        Cmd_Restart : 99, // 0x63
        Cmd_I2C_ReadWithAddress : 100, // 0x64
        Cmd_I2C_ReadInternal : 101, // 0x65
        Cmd_I2C_WriteInternal : 102, // 0x66
        Cmd_GetErrorList : 103, // 0x67
        Cmd_LED_SetState : 104, // 0x68
        Cmd_Power_SetVoltageRef : 105, // 0x69
        Cmd_Status_GetControllerType : 106, // 0x6A
        Cmd_Power_Enable : 107, // 0x6B
        Cmd_ADC_Enable : 108, // 0x6C
        Cmd_ADC_Acquire : 109, // 0x6D
        Cmd_ADC_GetData : 110, // 0x6E
        Cmd_ADC_GetStatus : 111, // 0x6F
        Cmd_ADC_SetReference : 112, // 0x70
        Cmd_Status_GetBoardRevision : 113, // 0x71
        Cmd_Status_EVMDetect : 114, // 0x72
        Cmd_ADC_AcquireTriggered : 115, // 0x73
        Cmd_Power_Notify : 116, // 0x74
        Cmd_Digital_Capture : 117, // 0x75
        Cmd_Digital_GetData : 118, // 0x76
        Cmd_Digital_GetStatus : 119, // 0x77
        Cmd_EasyScale_WriteAndRead : 120, // 0x78
        Cmd_DisplayScale_Set : 121, // 0x79
        Cmd_DisplayScale_WriteReg : 122, // 0x7A
        Cmd_DisplayScale_ReadReg : 123, // 0x7B
        Cmd_DisplayScale_WriteAndRead : 124,// 0x7C
        Cmd_Reserved_125 : 125, // 0x7D **
        Cmd_Reserved_126 : 126, // 0x7E **
        Cmd_Invalid : 127, // 0x7F
        Cmd_Stream_Start : 128, // 0x80
        Cmd_Stream_Stop : 129, // 0x81
        Cmd_Stream_Status : 130, // 0x82
        Cmd_Stream_GetData : 131, // 0x83
        Cmd_Stream_Execute : 132, // 0x84
        Cmd_SPI_StreamOut : 133, // 0x85
        Cmd_SPI_StreamStop : 134, // 0x86
        Cmd_SPI_WriteAndReadEx : 135, // 0x87
        Cmd_Reserved_136 : 136, // 0x88 **
        Cmd_Reserved_137 : 137, // 0x89 **
        Cmd_Pegasus_Test : 138, // 0x8A
        Cmd_Reserved_139 : 139, // 0x8B **
        Cmd_Port_Setup : 140, // 0x8C
        Cmd_Port_Read : 141, // 0x8D
        Cmd_Port_Write : 142, // 0x8E
        Cmd_Port_WritePulse : 143, // 0x8F
        Cmd_END : 144
    // 0x90

    // ** = UNUSED COMMAND
    };

    var szCommandName =
    [
        "Cmd_LoopPacket", // 0x00
        "Cmd_I2C_Control", // 0x01
        "Cmd_I2C_Write", // 0x02
        "Cmd_I2C_Read", // 0x03
        "Cmd_I2CRead_WithAddress", // 0x04
        "Cmd_GPIO_Write_Control", // 0x05
        "Cmd_GPIO_Write_States", // 0x06
        "Cmd_GPIO_Read_States", // 0x07
        "Cmd_SPI_Control", // 0x08
        "Cmd_SPI_WriteAndRead", // 0x09
        "Cmd_FirmwareVersion_Read", // 0x0A
        "Cmd_MSP430_WordWrite", // 0x0B
        "Cmd_MSP430_WordRead", // 0x0C
        "Cmd_MSP430_ByteWrite", // 0x0D
        "Cmd_MSP430_ByteRead", // 0x0E
        "Cmd_UART_Control", // 0x0F
        "Cmd_Reserved_16", // 0x10 **
        "Cmd_Reserved_17", // 0x11 **
        "Cmd_UART_Write", // 0x12
        "Cmd_UART_SetMode", // 0x13
        "Cmd_UART_Read", // 0x14
        "Cmd_Local_I2C_Write", // 0x15
        "Cmd_PWM_Write_Control", // 0x16
        "Cmd_Power_WriteControl", // 0x17
        "Cmd_Power_ReadStatus", // 0x18
        "Cmd_ADC_Control", // 0x19
        "Cmd_ADC_ConvertAndRead", // 0x1A
        "Cmd_LED_Control", // 0x1B
        "Cmd_Clock_Control", // 0x1C
        "Cmd_FEC_Control", // 0x1D
        "Cmd_FEC_CountAndRead", // 0x1E
        "Cmd_Interrupt_Control", // 0x1F
        "Cmd_Interrupt_Received", // 0x20
        "Cmd_EasyScale_Control", // 0x21
        "Cmd_EasyScale_Write", // 0x22
        "Cmd_EasyScale_Read", // 0x23
        "Cmd_EasyScale_ACK_Received", // 0x24
        "Cmd_GPIO_SetPort", // 0x25
        "Cmd_GPIO_WritePort", // 0x26
        "Cmd_GPIO_ReadPort", // 0x27
        "Cmd_Reserved_40", // 0x28 Reserved for end-user command **
        "Cmd_Reserved_41", // 0x29 Reserved for end-user command **
        "Cmd_Reserved_42", // 0x2A Reserved for end-user command **
        "Cmd_Reserved_43", // 0x2B Reserved for end-user command **
        "Cmd_Reserved_44", // 0x2C Reserved for end-user command **
        "Cmd_Reserved_45", // 0x2D Reserved for end-user command **
        "Cmd_Reserved_46", // 0x2E Reserved for end-user command **
        "Cmd_Reserved_47", // 0x2F Reserved for end-user command **
        "Cmd_Reserved_48", // 0x30 Reserved for end-user command **
        "Cmd_Reserved_49", // 0x31 Reserved for end-user command **
        "Cmd_SMBUS_SendByte", // 0x32
        "Cmd_SMBUS_WriteByte", // 0x33
        "Cmd_SMBUS_WriteWord", // 0x34
        "Cmd_SMBUS_WriteBlock", // 0x35
        "Cmd_SMBUS_ReceiveByte", // 0x36
        "Cmd_SMBUS_ReadByte", // 0x37
        "Cmd_SMBUS_ReadWord", // 0x38
        "Cmd_SMBUS_ReadBlock", // 0x39
        "Cmd_SMBUS_ProcessCall", // 0x3A
        "Cmd_SMBUS_BWBRProcessCall", // 0x3B
        "Cmd_SMBUS_Control", // 0x3C
        "Cmd_SMBUS_GetEchoBuffer", // 0x3D
        "Cmd_RFFE_RegZeroWrite", // 0x3E
        "Cmd_RFFE_RegWrite", // 0x3F
        "Cmd_RFFE_ExtRegWrite", // 0x40
        "Cmd_RFFE_ExtRegWriteLong", // 0x41
        "Cmd_RFFE_RegRead", // 0x42
        "Cmd_RFFE_ExtRegRead", // 0x43
        "Cmd_RFFE_ExtRegReadLong", // 0x44
        "Cmd_OneWire_SetMode", // 0x45
        "Cmd_OneWire_PulseSetup", // 0x46
        "Cmd_OneWire_PulseWrite", // 0x47
        "Cmd_OneWire_SetState", // 0x48
        "Cmd_Reserved_73", // 0x49 **
        "Cmd_Reserved_74", // 0x4A **
        "Cmd_Reserved_75", // 0x4B **
        "Cmd_Reserved_76", // 0x4C **
        "Cmd_Reserved_77", // 0x4D **
        "Cmd_Reserved_78", // 0x4E **
        "Cmd_Reserved_79", // 0x4F **
        "Cmd_Reserved_80", // 0x50 **
        "Cmd_Reserved_81", // 0x51 **
        "Cmd_Reserved_82", // 0x52 **
        "Cmd_Reserved_83", // 0x53 **
        "Cmd_Packet", // 0x54
        "Cmd_GPIO_SetCustomPort", // 0x55
        "Cmd_GPIO_WriteCustomPort", // 0x56
        "Cmd_GPIO_ReadCustomPort", // 0x57
        "Cmd_Reserved_88", // 0x58 **
        "Cmd_Reserved_89", // 0x59 **
        "Cmd_Reserved_90", // 0x5A **
        "Cmd_Reserved_91", // 0x5B **
        "Cmd_Reserved_92", // 0x5C **
        "Cmd_Reserved_93", // 0x5D **
        "Cmd_Reserved_94", // 0x5E **
        "Cmd_Reserved_95", // 0x5F **
        "Cmd_I2C_BlkWriteBlkRead", // 0x60
        "Cmd_InvokeBSL", // 0x61
        "Cmd_FirmwareDebugMode", // 0x62
        "Cmd_Restart", // 0x63
        "Cmd_I2C_ReadWithAddress", // 0x64
        "Cmd_I2C_ReadInternal", // 0x65
        "Cmd_I2C_WriteInternal", // 0x66
        "Cmd_GetErrorList", // 0x67
        "Cmd_LED_SetState", // 0x68
        "Cmd_Power_SetVoltageRef", // 0x69
        "Cmd_Status_GetControllerType", // 0x6A
        "Cmd_Power_Enable", // 0x6B
        "Cmd_ADC_Enable", // 0x6C
        "Cmd_ADC_Acquire", // 0x6D
        "Cmd_ADC_GetData", // 0x6E
        "Cmd_ADC_GetStatus", // 0x6F
        "Cmd_ADC_SetReference", // 0x70
        "Cmd_Status_GetBoardRevision", // 0x71
        "Cmd_Status_EVMDetect", // 0x72
        "Cmd_ADC_AcquireTriggered", // 0x73
        "Cmd_Power_Notify", // 0x74
        "Cmd_Digital_Capture", // 0x75
        "Cmd_Digital_GetData", // 0x76
        "Cmd_Digital_GetStatus", // 0x77
        "Cmd_EasyScale_WriteAndRead", // 0x78
        "Cmd_DisplayScale_Set", // 0x79
        "Cmd_DisplayScale_WriteReg", // 0x7A
        "Cmd_DisplayScale_ReadReg", // 0x7B
        "Cmd_DisplayScale_WriteAndRead", // 0x7C
        "Cmd_Reserved_125", // 0x7D **
        "Cmd_Reserved_126", // 0x7E **
        "Cmd_Invalid", // 0x7F
        "Cmd_Stream_Start", // 0x80
        "Cmd_Stream_Stop", // 0x81
        "Cmd_Stream_Status", // 0x82
        "Cmd_Stream_GetData", // 0x83
        "Cmd_Stream_Execute", // 0x84
        "Cmd_SPI_StreamOut", // 0x85
        "Cmd_SPI_StreamStop", // 0x86
        "Cmd_SPI_WriteAndReadEx", // 0x87
        "Cmd_Reserved_136", // 0x88 **
        "Cmd_Reserved_137", // 0x89 **
        "Cmd_Pegasus_Test", // 0x8A
        "Cmd_Reserved_139", // 0x8B **
        "Cmd_Port_Setup", // 0x8C
        "Cmd_Port_Read", // 0x8D
        "Cmd_Port_Write", // 0x8E
        "Cmd_Port_ReadMultiple", // 0x8F
        "Cmd_END", // 0x90
        "" // for loop control
    ];

    // error code constants
    var ERR_OK                      =  0;
    var ERR_COM_RX_OVERFLOW         = -1;
    var ERR_COM_RX_BUF_EMPTY        = -2;
    var ERR_COM_TX_BUF_FULL         = -3;
    var ERR_COM_TX_STALLED          = -4;
    var ERR_COM_TX_FAILED           = -5;
    var ERR_COM_OPEN_FAILED         = -6;
    var ERR_COM_PORT_NOT_OPEN       = -7;
    var ERR_COM_PORT_IS_OPEN        = -8;
    var ERR_COM_READ_TIMEOUT        = -9;
    var ERR_COM_READ_ERROR          = -10;
    var ERR_COM_WRITE_ERROR         = -11;
    var ERR_DEVICE_NOT_FOUND        = -12;
    var ERR_COM_CRC_FAILED          = -13;
    
    var ERR_INVALID_PORT            = -20;
    var ERR_ADDRESS_OUT_OF_RANGE    = -21;
    var ERR_INVALID_FUNCTION_CODE   = -22;
    var ERR_BAD_PACKET_SIZE         = -23;
    var ERR_INVALID_HANDLE          = -24;
    var ERR_OPERATION_FAILED        = -25;
    var ERR_PARAM_OUT_OF_RANGE      = -26;
    var ERR_PACKET_OUT_OF_SEQUENCE  = -27;
    var ERR_INVALID_PACKET_HEADER   = -28;
    var ERR_UNIMPLEMENTED_FUNCTION  = -29;
    var ERR_TOO_MUCH_DATA           = -30;
    var ERR_INVALID_DEVICE          = -31;
    var ERR_UNSUPPORTED_FIRMWARE    = -32;
    var ERR_BUFFER_TOO_SMALL        = -33;
    var ERR_NO_DATA                 = -34;
    var ERR_RESOURCE_CONFLICT       = -35;
    var ERR_NO_EVM                  = -36;
    var ERR_COMMAND_BUSY            = -37;
    var ERR_ADJ_POWER_FAIL          = -38;
    var ERR_NOT_ENABLED             = -39;
    
    var ERR_I2C_INIT_ERROR          = -40;
    var ERR_I2C_READ_ERROR          = -41;
    var ERR_I2C_WRITE_ERROR         = -42;
    var ERR_I2C_BUSY                = -43;
    var ERR_I2C_ADDR_NAK            = -44;
    var ERR_I2C_DATA_NAK            = -45;
    var ERR_I2C_READ_TIMEOUT        = -46;
    var ERR_I2C_READ_DATA_TIMEOUT   = -47;
    var ERR_I2C_READ_COMP_TIMEOUT   = -48;
    var ERR_I2C_WRITE_TIMEOUT       = -49;
    var ERR_I2C_WRITE_DATA_TIMEOUT  = -50;
    var ERR_I2C_WRITE_COMP_TIMEOUT  = -51;
    var ERR_I2C_NOT_MASTER          = -52;
    var ERR_I2C_ARBITRATION_LOST    = -53;
    var ERR_I2C_NO_PULLUP_POWER     = -54;
    
    var ERR_SPI_INIT_ERROR          = -60;
    var ERR_SPI_WRITE_READ_ERROR    = -61;
    
    var ERR_DATA_WRITE_ERROR        = -70;
    var ERR_DATA_READ_ERROR         = -71;
    var ERR_TIMEOUT                 = -72;
    var ERR_DATA_CRC_FAILED         = -73;
    var ERR_INVALID_PARAMETER       = -74;
    var ERR_NOT_INITIALIZED         = -75;
    
    var getErrorString = function(code)
    {
        switch (code)
        {
        case ERR_OK:                         return "No error";                             //  0
        case ERR_COM_RX_OVERFLOW:            return "Receiver overflowed";                  // -1
        case ERR_COM_RX_BUF_EMPTY:           return "Receive buffer is empty";              // -2
        case ERR_COM_TX_BUF_FULL:            return "Transmit buffer is full";              // -3
        case ERR_COM_TX_STALLED:             return "Transmit is stalled";                  // -4
        case ERR_COM_TX_FAILED:              return "Transmit failed";                      // -5
        case ERR_COM_OPEN_FAILED:            return "Failed to open communications port";   // -6
        case ERR_COM_PORT_NOT_OPEN:          return "Communications port is not open";      // -7
        case ERR_COM_PORT_IS_OPEN:           return "Communications port is open";          // -8
        case ERR_COM_READ_TIMEOUT:           return "Receive timeout";                      // -9
        case ERR_COM_READ_ERROR:             return "Communications port read error";       // -10
        case ERR_COM_WRITE_ERROR:            return "Communications port write error";      // -11
        case ERR_DEVICE_NOT_FOUND:           return "Communications device not found";      // -12
        case ERR_COM_CRC_FAILED:             return "Communications CRC failed";            // -13

        case ERR_INVALID_PORT:               return "Invalid port";                         // -20
        case ERR_ADDRESS_OUT_OF_RANGE:       return "Address is out of accepted range";     // -21
        case ERR_INVALID_FUNCTION_CODE:      return "Invalid function code";                // -22
        case ERR_BAD_PACKET_SIZE:            return "Invalid packet size";                  // -23
        case ERR_INVALID_HANDLE:             return "Invalid handle";                       // -24
        case ERR_OPERATION_FAILED:           return "Operation failed";                     // -25
        case ERR_PARAM_OUT_OF_RANGE:         return "Parameter is out of range";            // -26
        case ERR_PACKET_OUT_OF_SEQUENCE:     return "Packet is out of sequence";            // -27
        case ERR_INVALID_PACKET_HEADER:      return "Invalid packet header";                // -28
        case ERR_UNIMPLEMENTED_FUNCTION:     return "Function not implemented";             // -29
        case ERR_TOO_MUCH_DATA:              return "Too much data";                        // -30 
        case ERR_INVALID_DEVICE:             return "Invalid device";                       // -31
        case ERR_UNSUPPORTED_FIRMWARE:       return "Unsupported firmware version";         // -32
        case ERR_BUFFER_TOO_SMALL:           return "Buffer is too small";                  // -33
        case ERR_NO_DATA:                    return "No data available";                    // -34
        case ERR_RESOURCE_CONFLICT:          return "Resource conflict";                    // -35
        case ERR_NO_EVM:                     return "EVM is required for external power";   // -36
        case ERR_COMMAND_BUSY:               return "Command is busy";                      // -37
        case ERR_ADJ_POWER_FAIL:             return "Adjustable power supply failure";      // -38
        case ERR_NOT_ENABLED:                return "Not enabled";                          // -39

        case ERR_I2C_INIT_ERROR:             return "I2C initialization failed";            // -40
        case ERR_I2C_READ_ERROR:             return "I2C read error";                       // -41
        case ERR_I2C_WRITE_ERROR:            return "I2C write error";                      // -42
        case ERR_I2C_BUSY:                   return "I2C busy (transfer is pending)";       // -43
        case ERR_I2C_ADDR_NAK:               return "Address not acknowledged (NAK)";       // -44
        case ERR_I2C_DATA_NAK:               return "Data not acknowledged (NAK)";          // -45
        case ERR_I2C_READ_TIMEOUT:           return "Read timeout";                         // -46
        case ERR_I2C_READ_DATA_TIMEOUT:      return "Read data timeout";                    // -47
        case ERR_I2C_READ_COMP_TIMEOUT:      return "Timeout waiting for read complete";    // -48
        case ERR_I2C_WRITE_TIMEOUT:          return "Write timeout";                        // -49
        case ERR_I2C_WRITE_DATA_TIMEOUT:     return "Write data timeout";                   // -50
        case ERR_I2C_WRITE_COMP_TIMEOUT:     return "Timeout waiting for write complete";   // -51
        case ERR_I2C_NOT_MASTER:             return "I2C not in Master mode";               // -52
        case ERR_I2C_ARBITRATION_LOST:       return "I2C arbitration lost";                 // -53
        case ERR_I2C_NO_PULLUP_POWER:        return "I2C pullups require 3.3V power";       // -54

        case ERR_SPI_INIT_ERROR:             return "SPI initialization failed";            // -60
        case ERR_SPI_WRITE_READ_ERROR:       return "SPI write/read error";                 // -61

        case ERR_DATA_WRITE_ERROR:           return "Data write error";                     // -70
        case ERR_DATA_READ_ERROR:            return "Data read error";                      // -71
        case ERR_TIMEOUT:                    return "Operation timeout";                    // -72
        case ERR_DATA_CRC_FAILED:            return "Data CRC failed";                      // -73

        default:
            if (code > 0)
            {
                return "Success";                              // any positive value
            }
            break;
        }
    };

    var INTERRUPT_INT0 = 0; // Interrupt pin INT0
    var INTERRUPT_INT1 = 1; // Interrupt pin INT1
    var INTERRUPT_INT2 = 2; // Interrupt pin INT2
    var INTERRUPT_INT3 = 3; // Interrupt pin INT3
    var INTERRUPT_EVM = 4; // Interrupt pin EVM_DETECT
    var INTERRUPT_POWER = 5; // Interrupt for power event
    var INTERRUPT_ADC = 6; // Interrupt for ADC event
    var INTERRUPT_DIGITAL = 7; // Interrupt for Digital Capture event
    var INTERRUPT_ASYNC_IO = 8; // Interrupt for asynchronous I/O
    var INTERRUPT_CALLBACK_101 = 9; // Callback for Cmd_I2C_ReadInternal
    var INTERRUPT_CALLBACK_102 = 10; // Callback for Cmd_I2C_WriteInternal
    var INTERRUPT_SOURCES = 11; // Total number of interrupt sources

    // Controller Type constants
    var CTRLR_UNKNOWN = 0x0000;
    var CTRLR_USB2ANY = 0x0001;
    var CTRLR_ONEDEMO = 0x0002;
    var CTRLR_UNSUPPORTED = 0x0004;

    var VERSION_SIZE_IN_BYTES = 4;
    var VERSION_TO_DWORD = function(packet, offset)
    {
        var version = 0;
        for (var i = 0; i < VERSION_SIZE_IN_BYTES; i++)
        {
            version = (version << 4) | packet[offset + i];
        }
        return version;
    };

    var VER_MAJOR = 2;
    var VER_MINOR = 8;
    var VER_REVISION = 0;
    var VER_BUILD = 0;

    var MIN_FIRMWARE_REQUIRED = VERSION_TO_DWORD([2, 6, 2, 20], 0);

    var CRC_LEN = function(packet)
    {
        return PACKET_HEADER_SIZE - PACKET_PEC + packet[PACKET_PAYLOAD_LEN];
    };

    var CRC = function(initValue)
    {
        this.crc = initValue;
    };

    CRC.prototype.getValue = function()
    {
        return this.crc;
    };

    CRC.prototype.calculate = function(buf, offset, len)
    {
        len = len || buf.len;
        this.crc = 0; // zero initial value
        for (var i = offset; i < len; i++)
        {
            var x = ((this.crc >> 8) ^ buf[i]) & 0xff;
            x ^= x >> 4;
            this.crc = (this.crc << 8) ^ (x << 12) ^ (x << 5) ^ x;
        }
        return this.crc;
    };

    var CRC8TABLE =
        [
            0x00, 0x07, 0x0E, 0x09, 0x1C, 0x1B, 0x12, 0x15, 0x38, 0x3F, 0x36, 0x31, 0x24, 0x23, 0x2A, 0x2D, 0x70, 0x77, 0x7E, 0x79, 0x6C, 0x6B, 0x62, 0x65, 0x48, 0x4F, 0x46, 0x41, 0x54, 0x53, 0x5A, 0x5D, 0xE0, 0xE7, 0xEE, 0xE9, 0xFC, 0xFB, 0xF2, 0xF5, 0xD8, 0xDF, 0xD6, 0xD1, 0xC4, 0xC3, 0xCA, 0xCD, 0x90, 0x97, 0x9E,
            0x99, 0x8C, 0x8B, 0x82, 0x85, 0xA8, 0xAF, 0xA6, 0xA1, 0xB4, 0xB3, 0xBA, 0xBD, 0xC7, 0xC0, 0xC9, 0xCE, 0xDB, 0xDC, 0xD5, 0xD2, 0xFF, 0xF8, 0xF1, 0xF6, 0xE3, 0xE4, 0xED, 0xEA, 0xB7, 0xB0, 0xB9, 0xBE, 0xAB, 0xAC, 0xA5, 0xA2, 0x8F, 0x88, 0x81, 0x86, 0x93, 0x94, 0x9D, 0x9A, 0x27, 0x20, 0x29, 0x2E, 0x3B, 0x3C,
            0x35, 0x32, 0x1F, 0x18, 0x11, 0x16, 0x03, 0x04, 0x0D, 0x0A, 0x57, 0x50, 0x59, 0x5E, 0x4B, 0x4C, 0x45, 0x42, 0x6F, 0x68, 0x61, 0x66, 0x73, 0x74, 0x7D, 0x7A, 0x89, 0x8E, 0x87, 0x80, 0x95, 0x92, 0x9B, 0x9C, 0xB1, 0xB6, 0xBF, 0xB8, 0xAD, 0xAA, 0xA3, 0xA4, 0xF9, 0xFE, 0xF7, 0xF0, 0xE5, 0xE2, 0xEB, 0xEC, 0xC1,
            0xC6, 0xCF, 0xC8, 0xDD, 0xDA, 0xD3, 0xD4, 0x69, 0x6E, 0x67, 0x60, 0x75, 0x72, 0x7B, 0x7C, 0x51, 0x56, 0x5F, 0x58, 0x4D, 0x4A, 0x43, 0x44, 0x19, 0x1E, 0x17, 0x10, 0x05, 0x02, 0x0B, 0x0C, 0x21, 0x26, 0x2F, 0x28, 0x3D, 0x3A, 0x33, 0x34, 0x4E, 0x49, 0x40, 0x47, 0x52, 0x55, 0x5C, 0x5B, 0x76, 0x71, 0x78, 0x7F,
            0x6A, 0x6D, 0x64, 0x63, 0x3E, 0x39, 0x30, 0x37, 0x22, 0x25, 0x2C, 0x2B, 0x06, 0x01, 0x08, 0x0F, 0x1A, 0x1D, 0x14, 0x13, 0xAE, 0xA9, 0xA0, 0xA7, 0xB2, 0xB5, 0xBC, 0xBB, 0x96, 0x91, 0x98, 0x9F, 0x8A, 0x8D, 0x84, 0x83, 0xDE, 0xD9, 0xD0, 0xD7, 0xC2, 0xC5, 0xCC, 0xCB, 0xE6, 0xE1, 0xE8, 0xEF, 0xFA, 0xFD, 0xF4,
            0xF3
        ];

    var calculateCRC = function(buf, offset, len)
    {
        var crc = 0;

        len = len || buf.length;
        for (var i = offset; i < len; i++)
        {
            crc = CRC8TABLE[buf[i] ^ crc];
        }

        return crc;
    };
    
    var setBytes = function(array, size, value, offset)
    {
        var len = array.length;
        for(var i = size; i-- >0; )
        {
            array[len + i] = value & 0xff;
            value = value >>> 8;
        }
    };
    
    var getResult = function(array)
    {
        var result = 0;
        var size = PACKET_PAYLOAD + (array[PACKET_PAYLOAD_LEN] || 0);
        for(var i = PACKET_PAYLOAD; i < size; i++)
        {
            result = (result << 8) | (array[i] & 0xff);
        }
        return result;
    };
    
    var TheValue = 'The value "';
    var ForEntry = '", for entry ';
    var InRegDefs = ', in the register-defs.json file';
    
    var parseNumberProperty = function(message, value, min, max)
    {
        var result = +value;
        if (isNaN(result))
        {
            throw TheValue + value + ForEntry + message + InRegDefs + ' is not a number.';
        }
        if (min && result < min)
        {
            throw TheValue + value + ForEntry + message + InRegDefs + ' must be greater than ' + min + '.';
        }
        if (max && result > max)
        {
            throw TheValue + value + ForEntry + message + InRegDefs + ' must be less than ' + max + '.';
        }
        return result;
    };
    
    var parseStringProperty = function(message, value, valueMap)
    {
        var stringValue = ("" + value).toLowerCase();
        if (valueMap.hasOwnProperty(stringValue))
        {
            return valueMap[stringValue];
        }
        else
        {
            message = TheValue + value + ForEntry + message + InRegDefs + ' is not supported.  Valid entries are';
            var delimiter = ' "';
            var lastOption;
            for(var option in valueMap)
            {
                if (valueMap.hasOwnProperty(option))
                {
                    if (lastOption)
                    {
                        message = message + delimiter + lastOption;
                        delimiter = '", "';
                    }
                    lastOption = option;
                }
            }
            throw message + '", or "' + lastOption + '".';
        }
    };

    var I2C_100kHz = 0;
    var I2C_400kHz = 1;
    var I2C_10kHz  = 2;
    var I2C_800kHz = 3;
    
    var I2C_7Bits = 0;
    var I2C_10Bits = 1;

    var I2C_PullUps_OFF = 0;
    var I2C_PullUps_ON = 1;
    
    var I2C_Interface = function(deviceSettings) 
    {
        var i2cAddressHi = (deviceSettings.address >> 8) & 0xff;
        var i2cAddressLo = deviceSettings.address & 0xff;
        
        if (deviceSettings.rawi2c)
        {
            this.writeAddressData = [ i2cAddressHi, i2cAddressLo, 1, 0];
        }
        this.readData = [ i2cAddressHi, i2cAddressLo ];
        this.writeData = [ i2cAddressHi, i2cAddressLo  ];
    };
    
    I2C_Interface.prototype.control = function(u2a, settings)
    {
        var speed = I2C_10kHz;
        switch(settings.speed)
        {
            case 100:
                speed = I2C_100kHz;
                break;
            case 400:
                speed = I2C_400kHz;
                break;
            case 800:
                speed = I2C_800kHz;
                break;
        }
        
        var addrsBits = I2C_7Bits;
        switch(settings.addrsBits)
        {
            case 10:
                addrsBits = I2C_10Bits;
                break;
        }
        
        var pullUps = settings.pullup ? I2C_PullUps_ON : I2C_PullUps_OFF;
        
        u2a.sendCommandPacket(Command.Cmd_I2C_Control,
        [
            speed, addrsBits, pullUps
        ]);
    };

    I2C_Interface.prototype.read = function(u2a, info)
    {
        if (this.writeAddressData)
        {
            this.writeAddressData[3] = info.addr;
            u2a.sendCommandPacket(Command.Cmd_I2C_Write, this.writeAddressData);
            this.readData[2] = info.nBytes;
            return u2a.readResponse(u2a.sendCommandPacket(Command.Cmd_I2C_Read, this.readData)).then(getResult);
        }
        else
        {
            this.readData[2] = info.addr;
            this.readData[3] = info.nBytes;
            return u2a.readResponse(u2a.sendCommandPacket(Command.Cmd_I2C_ReadWithAddress, this.readData)).then(getResult);
        }
    };
    
    GPIO_Interface = function() {};
    
    GPIO_Interface.prototype.control = function(u2a, settings)
    {
        if (settings instanceof Array)
        {
            var modeMap = { "output": 1, "input": 2 };
            var resistorMap = { "pullup": 1, "pulldown": 2 };
            var pinStateMap = { "high": 2, "low": 1 };
            
            for(var i = 0; i < settings.length; i++)
            {
                var gpioPin = settings[i];
                if (gpioPin.hasOwnProperty('pin'))
                {
                    var pin = parseNumberProperty('pin, in the GPIO array', gpioPin.pin, 0, 12);
                    if (gpioPin.hasOwnProperty('mode'))
                    {
                        var pinFunction = parseStringProperty('mode', gpioPin.mode, modeMap);
                        if (gpioPin.hasOwnProperty('resistor'))
                        {
                            if (pinFunction === modeMap.input)
                            {
                                pinFunction += parseStringProperty('resistor', gpioPin.resistor, resistorMap);
                            }
                            else
                            {
                                throw 'GPIO pin ' + pin + '  with "output" mode, ' + InRegDefs + ' cannot have a "resistor" field.';
                            }
                        }
                        u2a.sendCommandPacket(Command.Cmd_GPIO_SetPort, [ pin, pinFunction ]);
                    }
                    if (gpioPin.hasOwnProperty('state'))
                    {
                        
                        var state = parseStringProperty('state, in the GPIO array', gpioPin.state, pinStateMap);
                        u2a.sendCommandPacket(Command.Cmd_GPIO_WritePort, [ pin, state ]);
                    }
                }
                else
                {
                    throw 'Entry number ' + i + ', in the GPIO array, is missing a pin field to identify the specific gpio pin instance.';
                }
            }
        }
        else 
        {
            throw 'The GPIO entry' + InRegDefs + ', must be an array type.';
        }
    };
    
    var writePromise = Q(true); 
    
    I2C_Interface.prototype.write = function(u2a, info, value)
    {
        if (4 + info.nBytes <= this.writeData.length)
        {
            this.writeData = this.writeData.slice(0, 4);
        }
        this.writeData[2] = info.nBytes+1;
        this.writeData[3] = info.addr;
        setBytes(this.writeData, info.nBytes, value, 4);
        u2a.sendCommandPacket(Command.Cmd_I2C_Write, this.writeData);
        return writePromise;
    };
    
    var UnknownCommInterface = function(deviceName) 
    {
        this.name = deviceName;
    };
    
    UnknownCommInterface.prototype.read = function()
    {
        throw "Unknow usb2any i/f for device " + this.name;
    };
    
    UnknownCommInterface.prototype.write = UnknownCommInterface.prototype.read;

    var FIFOQueue = function()
    {
        this.first = this.last = this;
    };

    FIFOQueue.prototype.push = function(data)
    {
        this.last.next =
        {
            data : data
        };
        this.last = this.last.next;
    };

    FIFOQueue.prototype.pop = function()
    {
        if (this.first !== this.last)
        {
            this.first = this.first.next;
            return this.first.data;
        }
    };
    
    FIFOQueue.prototype.peek = function()
    {
        if (this.first !== this.last)
        {
            return this.first.next.data;
        }
    };

    FIFOQueue.prototype.isEmpty = function()
    {
        return this.first === this.last;
    };

    var USB2ANY = function()
    {
        this.numPacketsReceived = 0;
        this._packetErrorCount = 0;
        this._isConnected = false;
        this.disconnect();
    };

    USB2ANY.prototype = new gc.databind.IPacketCodec();

    USB2ANY.prototype.connect = function(settings)
    {
        var that = this;
        return this.u2aOpen().then(function()
        {
            that.sendCommandPacket(Command.Cmd_LED_SetState, [2, 0]);  // turn on the green LED
          
            // apply power settings first, before initializing target comm interfaces
            if (settings.power)
            {
                var v33power = settings.power['V3.3'] ? 1 : 0;
                var v50power = settings.power['V5.0'] ? 1 : 0;
                var vadjpower = settings.power['Vadj'] ? 1 : 0;
                that.sendCommandPacket(Command.Cmd_Power_Enable, [ v33power, v50power, vadjpower, 0 ]);
                that.u2aPower_ReadStatus().then(function(status) 
                {
                    if ((status & 7) !== 0)
                    {
                        throw 'USB2ANY power fault detected for ' + (status & 1) ? '3.3V.' : (status & 2) ? '5.0V.' : 'Vadj.';
                    }
                });
            }
            
            
            // initialize and validate all the communication interfaces for the target.
            for(var section in settings)
            {
                if (settings.hasOwnProperty(section))
                {
                    switch(section)
                    {
                        case 'devices':
                            break;
                        case 'power':
                            break;
                        case 'i2c':
                            I2C_Interface.prototype.control(that, settings.i2c);
                            break;
                        case 'gpio':
                            GPIO_Interface.prototype.control(that, settings.gpio || settings.GPIO);
                            break;
                        default:
                            throw 'The entry "' + section + '" in the regsiter-defs.json file is not supported.  Please remove this entry and try again.';  
                    }
                }
            }
            
            // initialize comm interfaces for all devices, including unknown ones.
            var devices = settings.devices;
            if (devices && devices.length > 0)
            {
                for(var i = devices.length; i-- > 0; )
                {
                    var device = devices[i];
                    device._comm = new UnknownCommInterface(device.name);
                    
                    var commInterfaceName = device['interface'];
                    if (commInterfaceName)
                    {
                        switch(commInterfaceName)
                        {
                            case 'i2c':
                                device._comm = new I2C_Interface(device);
                                break;
                        }
                    }
                }
            }
            that._ready.resolve(true);
            that._ready = undefined;
        });
    };

    USB2ANY.prototype.disconnect = function(callback)
    {
        if (!this._ready)
        {
            this._ready = Q.defer();
        }
        this.reset();
    };

    USB2ANY.prototype.readValue = function(registerInfo)
    {
        if (this._ready)
        {
            var that = this;
            return this._ready.promise.then(function()
            {
                return that.readValue(registerInfo);
            });
        }
        var comm = registerInfo.parentGroup.parentDevice._comm;
        return comm.read(this, registerInfo);
    };

    USB2ANY.prototype.writeValue = function(registerInfo, value)
    {
        if (this._ready)
        {
            var that = this;
            return this._ready.promise.then(function()
            {
                return that.writeValue(registerInfo, value);
            });
        }
        var comm = registerInfo.parentGroup.parentDevice._comm;
        return comm.write(this, registerInfo, value);
    };

    var logPacket = function(message,  buffer, len)
    {
        len = len || buffer.length;
        for(var i = 0; i < len; i++)
        {
            message = message + buffer[i].toString(16) + ', ';
        }
        console.log(message);
    };

    USB2ANY.prototype.encode = function(target, value)
    {
        if (LOG_PACKETS)
        {
            logPacket('USB2ANY: down ', value);
        }
        target(value);
    };

    var RUNAWAY_THRESHOLD = 10;
    
    USB2ANY.prototype.decode = function(target, rawData)
    {
        try
        {
            var nRead = rawData.length;
            if (rawData[0] !== 0x3F || this._packetErrorCount > RUNAWAY_THRESHOLD)
            {
                return;
            }
            if (nRead > MAX_PACKET_SIZE)
            {
                this._packetErrorCount++;
                throw getErrorString(ERR_TOO_MUCH_DATA);
            }
            if (nRead < PACKET_HEADER_SIZE + HID_RESERVED)
            {
                this._packetErrorCount++;
                throw getErrorString(ERR_BAD_PACKET_SIZE);
            }
            if (rawData[PACKET_ID] !== PACKET_IDENTIFIER || rawData[PACKET_PAYLOAD_LEN] > MAX_PAYLOAD)
            {
                throw getErrorString(ERR_INVALID_PACKET_HEADER);
            }
            var crc = calculateCRC(rawData, PACKET_PAYLOAD_LEN, rawData[PACKET_PAYLOAD_LEN] + PACKET_HEADER_SIZE + HID_RESERVED);
            if (rawData[PACKET_PEC] !== crc)
            {
                throw getErrorString(ERR_COM_CRC_FAILED);
            }
            var cmd = rawData[PACKET_COMMAND];
            if (cmd < 0 || cmd > Command.Cmd_END)
            {
                throw getErrorString(ERR_INVALID_FUNCTION_CODE);
            }
            var type = rawData[PACKET_TYPE];
            
            if (LOG_PACKETS)
            {
                logPacket('USB2ANY:  up  ', rawData, rawData[PACKET_PAYLOAD_LEN] + PACKET_HEADER_SIZE + HID_RESERVED);
            }
            
            if (type === INTERRUPT_PACKET)
            {
                this.interruptReceived(rawData[PACKET_PAYLOAD], rawData[PACKET_PAYLOAD + 1]);
            }
            else if (type === PAYLOAD_PACKET)
            {
                switch (rawData[PACKET_COMMAND])
                {
                    case Command.Cmd_ADC_GetStatus:
                        var param = rawData[PACKET_PAYLOAD + 3];
                        if (param !== 0)
                        {
                            this.interruptReceived(INTERRUPT_ADC, param);
                        }
                        break;
                    case Command.Cmd_ADC_GetData:
                        break;

                    // TODO: finish this.
                }
            }
            else if (type === REPLY_PACKET)
            {
                var step = -1;
                var responseData = this.responseQueue.peek();
                
                while(responseData && step < 0)
                {
                    var packetData = responseData.packet;
                    step = packetData[PACKET_SEQ_NUM] - rawData[PACKET_SEQ_NUM];
                    
                    if (step < -100) 
                    {
                        step += 255;
                    }
                    else if (step > 100)
                    {
                        step -= 255;
                    }
                    
                    if (step < 0)
                    {
                        responseData.deferred.reject('USB2ANY error: missing response for command sequence #' + packetData[PACKET_SEQ_NUM]);
                        this.responseQueue.pop();
                        responseData = this.responseQueue.peek();
                    }
                    else if (step === 0)
                    {
                        if (rawData[PACKET_COMMAND] !== packetData[PACKET_COMMAND])
                        {
                            responseData.deferred.reject('USB2ANY error: Command mismatch on response for sequence #' + packetData[PACKET_SEQ_NUM]); 
                        }
                        else
                        {
                            responseData.deferred.resolve(rawData);
                        }
                        this.responseQueue.pop();
                    }
                }
            }
            else if (type === ERROR_PACKET)
            {
                var errorCode = rawData[PACKET_STATUS];
                throw getErrorString(errorCode - 256);
            }
            this._isConnected = true;
            this.numPacketsReceived++;
        }
        catch (e)
        {
            this._isConnected = false;
            console.log('USB2ANY error: ' + e);
        }
        return this._isConnected;
    };

    USB2ANY.prototype.reset = function()
    {
        if (this.responseQueue)
        {
            var responseData = this.responseQueue.pop();
            while (responseData)
            {
                responseData.deferred.reject("Skipping response from USB2ANY due to reset operation");
                responseData = this.responseQueue.pop();
            }
        }

        this.m_bPacketSeqNum = 1;
        this.responseQueue = new FIFOQueue();
        this.nControllerType = CTRLR_UNKNOWN;
    };

    USB2ANY.prototype.sendCommandPacket = function(cmd, buffer)
    {
        if (buffer.length > MAX_PAYLOAD)
        {
            throw "Too much payload data for a single packet.";
        }
        if (cmd < 0 || cmd > Command.Cmd_END)
        {
            throw "Invalid function Code: " + cmd;
        }
        else if (this.m_bPacketSeqNum === 255) 
        {
            this.m_bPacketSeqNum = 1;   // seq_num 0 is reserved for
                                        // asynchronous packets
        }
        var packet =
        [
            0x3F, buffer.length + PACKET_HEADER_SIZE, PACKET_IDENTIFIER, 0, buffer.length, COMMAND_PACKET, 0, this.m_bPacketSeqNum++, 0, cmd
        ];
        for (var i = 0; i < buffer.length; i++)
        {
            packet.push(buffer[i]);
        }
        packet[PACKET_PEC] = calculateCRC(packet, PACKET_PAYLOAD_LEN);

        this.encoder(packet);
        return packet;
    };

    USB2ANY.prototype.readResponse = function(forPacket)
    {
        var deferred = Q.defer();

        this.responseQueue.push(
        {
            packet : forPacket,
            deferred : deferred
        });

        return deferred.promise;
    };

    USB2ANY.prototype.u2aOpen = function()
    {
        this.sendCommandPacket(Command.Cmd_Status_GetControllerType,[ 0, 0, 0, 0 ]);
        return this.readResponse(this.sendCommandPacket(Command.Cmd_FirmwareVersion_Read, [ 0,0,0,0 ])).then(function(responsePacket)
        {
            var nReceived = responsePacket[PACKET_PAYLOAD_LEN];
            if (nReceived !== VERSION_SIZE_IN_BYTES)
            {
                this.dwFirmwareVersion = 0;
                this.version = 'UNKNOWN';
            }
            else
            {
                this.dwFirmwareVersion = VERSION_TO_DWORD(responsePacket, PACKET_PAYLOAD);
                this.version = responsePacket[PACKET_PAYLOAD] + '.' + responsePacket[PACKET_PAYLOAD + 1] + '.' + responsePacket[PACKET_PAYLOAD + 2] + '.' + responsePacket[PACKET_PAYLOAD + 3];
            }

            return this.readResponse(this.sendCommandPacket(Command.Cmd_Status_GetControllerType,
            [
                0, 0, 0, 0
            ]));
        }.bind(this)).then(function(responsePacket)
        {
            this.nControllerType = responsePacket[PACKET_PAYLOAD];
            switch (this.nControllerType)
            {
                case CTRLR_USB2ANY:
                    this.controllerName = "USB2ANY";
                    break;
                case CTRLR_ONEDEMO:
                    this.controllerName = "OneDemo";
                    break;
                default:
                    this.nControllerType = this.dwFirmwareVersion === 0 ? CTRLR_UNKNOWN : CTRLR_USB2ANY;
                    this.controllerName = this.dwFirmwareVersion === 0 ? "<unknown device?" : "USB2ANY";
                    break;
            }

            if (this.dwFirmwareVersion < MIN_FIRMWARE_REQUIRED)
            {
                this.nControllerType = CTRLR_UNSUPPORTED;
                throw "Unsupported USB2ANY controller";
            }
        }.bind(this));
    };

    USB2ANY.prototype.u2aStatus_GetControllerType = function()
    {
        return this.nControllerType;
    };
    
    var onPowerStatusRead = function(packet)
    {
        return packet[PACKET_PAYLOAD] | (packet[PACKET_PAYLOAD+1] << 1) | (packet[PACKET_PAYLOAD+2] << 2) | (packet[PACKET_PAYLOAD+3] << 3);
    };
    
    USB2ANY.prototype.u2aPower_ReadStatus = function()
    {
        return this.readResponse(this.sendCommandPacket(Command.Cmd_Power_ReadStatus, [0, 0, 0x5a, 0x5a])).then(onPowerStatusRead);
    };
    
    gc.databind.registerCustomCodec('USB2ANY', USB2ANY);

}());