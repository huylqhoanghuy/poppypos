export const parseSafeNumber = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const strVal = String(val).replace(/,/g, '.');
    const num = Number(strVal);
    return isNaN(num) ? 0 : num;
};

export const displayViNumber = (val) => {
    if (val === undefined || val === null) return '';
    return String(val).replace(/\./g, ',');
};
