export class Utilities{
    public static convertFromBlockchainFormat(value, decimals){
        const pow = Math.pow(10, decimals);
        const res = value/pow;
        return res;
    }
    
    public static convertToBlockchainFormat(value, decimals){
        return value * Math.pow(10, decimals);
    }

    public static stringifyBalance (balance, bnDecimals) {
        if (balance === 0) {
          return '0';
        }
    
        const decimals = parseInt(bnDecimals.toString())
        if (decimals === 0) {
          return balance.toString();
        }
    
        let bal = balance.toFixed();
        let len = bal.length;
        let decimalIndex = len - decimals;
        let prefix = '';
    
        if (decimalIndex < 0) {
          while (prefix.length <= decimalIndex * -1) {
            prefix += '0';
            len++;
          }
          bal = prefix + bal;
          decimalIndex = 1;
        }
    
        const result = `${bal.substr(0, len - decimals)}.${bal.substr(decimalIndex,3)}`;
        return result;
      }

    public static wrapAddress(address: string, prefLen: number, sufLen: number, delimiter: string){
        const len = address.length;
        const result = `${address.substr(0, prefLen)}${delimiter}${address.substr(len - sufLen)}`;

        return result;
    }

    public static sortArrayByDate(source, direction: SortDirectionEnum) {
        if (direction == SortDirectionEnum.desc) {
            source.sort((a, b) => {
                if (b.date < a.date) { return -1; }
                if (b.date > a.date) { return 1; }
                return 0;
            })
        }

        if (direction == SortDirectionEnum.asc) {
          source.sort((a, b) => {
              if (a.date < b.date) { return -1; }
              if (a.date > b.date) { return 1; }
              return 0;
          })
        }
    }
}

export enum SortDirectionEnum {
    asc,
    desc
  }
  