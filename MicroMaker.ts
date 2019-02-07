/**
 * makecode BME280 digital pressure and humidity sensor Package.
 * From microbit/micropython Chinese community.
 * http://www.micropython.org.cn
 */

enum I2C_ADDRESS {
    //% block="0x76"
    BME_ADDR_0x76 = 0x76,
    //% block="0x77"
    BME_ADDR_0x77 = 0x77,
    //% block="0x4A"
    MAX4409_ADDR_0x4A = 0x4A
}

/**
 * BME280 block
 */
//% weight=100 color=#eb8d31 icon="" block="Micromaker Investigation"
//% groups=['BME280','MAX44009','Other']
namespace micromaker {
    let BME280_I2C_ADDR = I2C_ADDRESS.BME_ADDR_0x76
    let MAX44009_I2C_ADDR = I2C_ADDRESS.MAX4409_ADDR_0x4A

    function setregBME(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(BME280_I2C_ADDR, buf);
    }

    function getregBME(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.UInt8BE);
    }

    function getregMAX44009(reg: number): number {
        pins.i2cWriteNumber(MAX44009_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(MAX44009_I2C_ADDR, NumberFormat.UInt8BE);
    }

    function getInt8LEBME(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.Int8LE);
    }

    function getUInt16LEBME(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.UInt16LE);
    }

    function getInt16LEBME(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.Int16LE);
    }

    let dig_T1 = getUInt16LEBME(0x88)
    let dig_T2 = getInt16LEBME(0x8A)
    let dig_T3 = getInt16LEBME(0x8C)
    let dig_P1 = getUInt16LEBME(0x8E)
    let dig_P2 = getInt16LEBME(0x90)
    let dig_P3 = getInt16LEBME(0x92)
    let dig_P4 = getInt16LEBME(0x94)
    let dig_P5 = getInt16LEBME(0x96)
    let dig_P6 = getInt16LEBME(0x98)
    let dig_P7 = getInt16LEBME(0x9A)
    let dig_P8 = getInt16LEBME(0x9C)
    let dig_P9 = getInt16LEBME(0x9E)
    let dig_H1 = getregBME(0xA1)
    let dig_H2 = getInt16LEBME(0xE1)
    let dig_H3 = getregBME(0xE3)
    let a = getregBME(0xE5)
    let dig_H4 = (getregBME(0xE4) << 4) + (a % 16)
    let dig_H5 = (getregBME(0xE6) << 4) + (a >> 4)
    let dig_H6 = getInt8LEBME(0xE7)
    setregBME(0xF2, 0x04)
    setregBME(0xF4, 0x2F)
    setregBME(0xF5, 0x0C)
    let T = 0
    let P = 0
    let H = 0
    let L = 0

    function get(): void {
        let adc_T = (getregBME(0xFA) << 12) + (getregBME(0xFB) << 4) + (getregBME(0xFC) >> 4)
        let var1 = (((adc_T >> 3) - (dig_T1 << 1)) * dig_T2) >> 11
        let var2 = (((((adc_T >> 4) - dig_T1) * ((adc_T >> 4) - dig_T1)) >> 12) * dig_T3) >> 14
        let t = var1 + var2
        T = ((t * 5 + 128) >> 8) / 100
        var1 = (t >> 1) - 64000
        var2 = (((var1 >> 2) * (var1 >> 2)) >> 11) * dig_P6
        var2 = var2 + ((var1 * dig_P5) << 1)
        var2 = (var2 >> 2) + (dig_P4 << 16)
        var1 = (((dig_P3 * ((var1 >> 2) * (var1 >> 2)) >> 13) >> 3) + (((dig_P2) * var1) >> 1)) >> 18
        var1 = ((32768 + var1) * dig_P1) >> 15
        if (var1 == 0)
            return; // avoid exception caused by division by zero

        let adc_P = (getregBME(0xF7) << 12) + (getregBME(0xF8) << 4) + (getregBME(0xF9) >> 4)
        let _p = ((1048576 - adc_P) - (var2 >> 12)) * 3125
        _p = (_p / var1) * 2;
        var1 = (dig_P9 * (((_p >> 3) * (_p >> 3)) >> 13)) >> 12
        var2 = (((_p >> 2)) * dig_P8) >> 13
        P = _p + ((var1 + var2 + dig_P7) >> 4)

        let adc_H = (getregBME(0xFD) << 8) + getregBME(0xFE)
        var1 = t - 76800
        var2 = (((adc_H << 14) - (dig_H4 << 20) - (dig_H5 * var1)) + 16384) >> 15
        var1 = var2 * (((((((var1 * dig_H6) >> 10) * (((var1 * dig_H3) >> 11) + 32768)) >> 10) + 2097152) * dig_H2 + 8192) >> 14)
        var2 = var1 - (((((var1 >> 15) * (var1 >> 15)) >> 7) * dig_H1) >> 4)
        if (var2 < 0) var2 = 0
        if (var2 > 419430400) var2 = 419430400
        H = (var2 >> 12) / 1024
    }

    /**
     * get pressure
     */
    //% blockId="BME280_GET_PRESSURE" block="get pressure"
    //% weight=80 blockGap=8
    //% group="BME280"
    export function pressure(): number {
        get();
        return P;
    }

    /**
     * get temperature
     */
    //% blockId="BME280_GET_TEMPERATURE" block="get temperature"
    //% weight=80 blockGap=8
    //% group="BME280"
    export function temperature(): number {
        get();
        return T;
    }

    /**
     * get humidity
     */
    //% blockId="BME280_GET_HUMIDITY" block="get humidity"
    //% weight=80 blockGap=8
    //% group="BME280"
    export function humidity(): number {
        get();
        return H;
    }

    /**
     * get light
     */
    //% blockId="MAX44009_GET_LIGHT" block="get light"
    //% weight=80 blockGap=8
    //% group="MAX44009"
    export function light(): number {

        let regHigh = 0x03
        let regLow = 0x04

        pins.i2cWriteNumber(MAX44009_I2C_ADDR, regHigh, NumberFormat.UInt8BE);
        let high = pins.i2cReadNumber(MAX44009_I2C_ADDR, NumberFormat.UInt8BE);

        pins.i2cWriteNumber(MAX44009_I2C_ADDR, regLow, NumberFormat.UInt8BE);
        let low = pins.i2cReadNumber(MAX44009_I2C_ADDR, NumberFormat.UInt8BE);

        let exponent = (high & 0xf0) >> 4;
        let mant = (low & 0x0f) << 4 | low;
        L = (((0x00000001 << exponent) * mant) * 0.045)

        L = Math.round(L)

        return L;
    }



}
