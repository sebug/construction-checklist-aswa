const searchParams = new URLSearchParams(location.search);
document.querySelector('#nameOfConstruction').value = searchParams.get('construction');
const d = new Date();
const year = d.getFullYear();
let month = '' + (d.getMonth() + 1);
if (month.length < 2) {
    month = '0' + month;
}
let day = '' + d.getDate();
if (day.length < 2) {
    day = '0' + day;
}
document.querySelector('#date').value = year + '-' + month + '-' + day;
const accessCodeInput = document.querySelector('#accessCode');
const nameOfConstructionInput = document.querySelector('#nameOfConstruction');

const checkAccessCode = async () => {
    const accessCode = accessCodeInput.value;
    const nameOfConstruction = nameOfConstructionInput.value;
    let isValid = false;
    if (!accessCode || !nameOfConstruction) {
        isValid = false;
    } else {
        try {
            const response = await fetch('/api/CheckAccessCodeTrigger', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    construction: nameOfConstruction,
                    accessCode: accessCode
                })
            });
            if (response.status !== 200) {
                return;
            }
            const obj = await response.json();
            isValid = obj.isValid;
        } catch (err) {
            console.log(err);
            isValid = false;
        }
    }
    if (isValid) {
        accessCodeInput.setAttribute('class', 'form-control valid-access-code');
        document.querySelector('.access-code-ok').style.display = 'inline';
        document.querySelector('.construction-details-entry').style.display = 'block';
    } else {
        accessCodeInput.setAttribute('class', 'form-control invalid-access-code');
        document.querySelector('.access-code-ok').style.display = 'none';
        document.querySelector('.construction-details-entry').style.display = 'none';
    }
};
accessCodeInput.addEventListener('change', checkAccessCode);
nameOfConstructionInput.addEventListener('change', checkAccessCode);

