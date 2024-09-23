console.log('List part');

async function getList() {
    let getListResponse = await fetch('/api/GetChecklists');
    let mainElement = document.querySelector('main');
    if (getListResponse.status !== 200) {
        let loginDiv = document.createElement('div');
        loginDiv.setAttribute('class', 'login');
        loginDiv.innerHTML = '<h2>Besoin d\'un code d\'accès</h2>' +
        '<p>Entrez le code d\'accès pour voir la liste: <input type="password" id="accesscode" /> <button id="submitaccesscode">Afficher</button>' +
        '</p>';
        loginDiv.querySelector('#submitaccesscode').addEventListener('click', () => {
            let accessCode = document.querySelector('#accesscode');
            fetch('/api/GetChecklists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    accessCode: accessCode.value
                })
            }).then(clResponse => {
                if (clResponse.status === 200) {
                    location.reload();
                    return;
                }
                alert('Mauvais code d\'accès');
            })
        });

        mainElement.appendChild(loginDiv);
        return;
    }
    const getListObject = await getListResponse.json();

    const checklistsDetail = constructCheckinsDetail(getListObject);

    mainElement.appendChild(checklistsDetail);
}

function constructCheckinsDetail(getListObject) {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.innerHTML = 'Contrôles des Constructions';
    details.appendChild(summary);
    const descriptionParagraph = document.createElement('p');
    descriptionParagraph.innerHTML = 'Ci-dessous vous trouvez une liste des contrôles des constructions';
    details.appendChild(descriptionParagraph);
    return details;
}

getList();