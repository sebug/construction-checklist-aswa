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
    details.setAttribute('open', 'true');
    const summary = document.createElement('summary');
    summary.innerHTML = 'Contrôles des Constructions';
    details.appendChild(summary);

    const table = document.createElement('table');

    const thead = document.createElement('thead');

    const headerTr = document.createElement('tr');

    const dateTh = document.createElement('th');
    dateTh.innerHTML = 'Date';

    headerTr.appendChild(dateTh);

    const constructionTh = document.createElement('th');
    constructionTh.innerHTML = 'Construction';

    headerTr.appendChild(constructionTh);

    thead.appendChild(headerTr);

    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    table.appendChild(tbody);

    for (const checklist of getListObject.checklists) {
        const checklistRow = constructChecklistRow(checklist);

        tbody.appendChild(checklistRow);
    }

    details.appendChild(table);

    return details;
}

function constructChecklistRow(checklist) {
    const tr = document.createElement('tr');

    const dateTd = document.createElement('td');
    dateTd.innerHTML = new Date(checklist.timestamp).toLocaleString();

    tr.appendChild(dateTd);

    const constructionTd = document.createElement('td');
    constructionTd.innerHTML = checklist.partitionKey;

    tr.appendChild(constructionTd);

    return tr;
}

getList();