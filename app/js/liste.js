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

    const oneHour = 3600000;
    for (const checklist of getListObject.checklists) {
        const matchingCheckins = getListObject.checkins.filter(dto =>
            dto.Construction.toLowerCase() === checklist.partitionKey.toLowerCase()
        ).filter(dto => Math.abs(new Date(checklist.timestamp) - new Date(dto.timestamp)) < oneHour * 2);
        const matchingCheckouts = getListObject.checkouts.filter(dto =>
            dto.Construction.toLowerCase() === checklist.partitionKey.toLowerCase()
        ).filter(dto => Math.abs(new Date(checklist.timestamp) - new Date(dto.timestamp)) < oneHour * 2 &&
            new Date(checklist.timestamp) < new Date(dto.timestamp));
        if (matchingCheckins.length) {
            checklist.checkin = matchingCheckins[matchingCheckins.length - 1].timestamp;
        }
        if (matchingCheckouts.length) {
            checklist.checkout = matchingCheckouts[0].timestamp;
        }
    }

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

    const headingsToEntry = [
        {
            heading: 'Éclairage',
            entry: o => o.illumination,
            detail: o => o.illuminationComments
        },
        {
            heading: 'Hygrométrie + Temp.',
            entry: o => o.hygrometrie,
            detail: o => o.hygrometrieComments
        },
        {
            heading: 'Matériel él. cuisine',
            entry: o => o.kitchen,
            detail: o => o.kitchenComments
        },
        {
            heading: 'Eau',
            entry: o => o.water,
            detail: o => o.waterComments
        },
        {
            heading: 'Accès',
            entry: o => o.access,
            detail: o => o.accessComments
        },
        {
            heading: 'Grilles de Sol',
            entry: o => o.floor,
            detail: o => o.floorComments
        },
        {
            heading: 'Générateur',
            entry: o => o.generator,
            detail: o => o.generatorComments
        },
        {
            heading: 'Liste de contrôle',
            entry: o => o.controllist,
            detail: o => o.controllistComments
        },
        {
            heading: 'Déshumidificateur',
            entry: o => o.dehumidifier,
            detail: o => o.dehumidifierComments
        },
        {
            heading: 'Lampes Gifas',
            entry: o => o.gifas,
            detail: o => o.gifasComments
        },
        {
            heading: 'Enveloppe',
            entry: o => o.enveloppe,
            detail: o => o.enveloppeComments
        },
        {
            heading: 'Joints',
            entry: o => o.joints,
            detail: o => o.jointsComments
        }
    ];

    headerTr.appendChild(headerTh('Date'));
    headerTr.appendChild(headerTh('Construction'));
    headerTr.appendChild(headerTh('Scan Entrée'));
    headerTr.appendChild(headerTh('Scan Sortie'));
    for (let headingToEntry of headingsToEntry) {
        headerTr.appendChild(headerTh(headingToEntry.heading));
    }

    thead.appendChild(headerTr);

    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    table.appendChild(tbody);

    for (const checklist of getListObject.checklists) {
        const checklistRow = constructChecklistRow(checklist, headingsToEntry);

        tbody.appendChild(checklistRow);
    }

    details.appendChild(table);

    return details;
}

function headerTh(text) {
    const th = document.createElement('th');
    th.innerHTML = text;
    return th;
}

function constructChecklistRow(checklist, headingsToEntry) {
    const tr = document.createElement('tr');

    const dateTd = document.createElement('td');
    dateTd.innerHTML = new Date(checklist.timestamp).toLocaleString();

    tr.appendChild(dateTd);

    const constructionTd = document.createElement('td');
    constructionTd.innerHTML = checklist.partitionKey;

    tr.appendChild(constructionTd);

    tr.appendChild(timeTD(checklist.checkin));
    tr.appendChild(timeTD(checklist.checkout));

    for (let headingToEntry of headingsToEntry) {
        tr.appendChild(checklistTd(headingToEntry.entry(checklist), headingToEntry.detail(checklist)));
    }

    return tr;
}

function timeTD(date) {
    const td = document.createElement('td');

    if (date) {
        td.innerHTML = new Date(date).toLocaleTimeString();
    } else {
        td.innerHTML = '⚠️';
    }

    return td;
}

function checklistTd(value, detail) {
    const td = document.createElement('td');
    if (value === 'ok') {
        td.innerHTML = '✅';
    } else if (value === 'torepair') {
        td.innerHTML = '❌';
    } else {
        td.innerHTML = '❓';
    }

    if (detail) {
        td.setAttribute('title', detail);
    }

    return td;
}

getList();