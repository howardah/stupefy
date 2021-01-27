const encode = (message, key) => {
  const messageArr = message.split("");
  const keyArr = key.split("");

  let returnArr = [];

  messageArr.forEach((letter, i) => {
    let thisIn = indexArr.indexOf(letter),
      keyIn = indexArr.indexOf(keyArr[i % keyArr.length]);

    returnArr.push(printArr[(thisIn + keyIn) % printArr.length]);
  });

  return returnArr.join("");
};

const decode = (message, key) => {
  const messageArr = message.split("");
  const keyArr = key.split("");

  let returnArr = [];

  messageArr.forEach((letter, i) => {
    let thisIn = printArr.indexOf(letter),
      keyIn = indexArr.indexOf(keyArr[i % keyArr.length]),
      length = indexArr.length;

    returnArr.push(indexArr[(((thisIn - keyIn) % length) + length) % length]);
  });

  return returnArr.join("");
};

const indexArr = [
  ..."abcdefghijklmnopqrstuvwxyz".split(''),
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(''),
  ..."ÁÀÂÄÃÅÆÇÉÈÊËÍÌÎÏÑÓÒÔÖÕØŒÚÙÛÜ".split(''),
  ..."áàâäãåæçéèêëíìîïñóòôöõøœßúùûü".split(''),
  ..."1234567890!@$%^&*()_+,.<>".split(''),
  ..."æçœåßÀÜÎïŒØÆĘÇ∂".split(''),
];
const printArr = [
  ..."abcdefghijklmnopqrstuvwxyz".split(''),
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(''),
  ..."ÁÀÂÄÃÅÆÇÉÈÊËÍÌÎÏÑÓÒÔÖÕØŒÚÙÛÜ".split(''),
  ..."áàâäãåæçéèêëíìîïñóòôöõøœßúùûü".split(''),
  ..."1234567890!@$%^&*()_+,.<>".split(''),
  ..."æçœåßÀÜÎïŒØÆĘÇ∂".split(''),
];

module.exports = { encode, decode };
