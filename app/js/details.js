console.log('details');

async function getDetails() {
    let searchParams = new URLSearchParams(location.search);
    const getEntityResponse = await fetch('/api/ChecklistReportTrigger?partitionKey=' +
        searchParams.get('partitionKey') + '&rowKey=' +
        searchParams.get('rowKey')
    );
    const construction = await getEntityResponse.json();

    const h1 = document.querySelector('h1');
    h1.innerHTML = 'Contrôle ' + construction.partitionKey;

    const main = document.querySelector('main');

    const controlDate = document.createElement('p');
    controlDate.innerHTML = 'Date de contrôle: ' + (new Date(construction.rowKey).toLocaleString());

    main.appendChild(controlDate);

    const sections = [
        {
            key: 'access',
            title: 'Éclairage (Changement ampoules et Néons)'
        },
        {
            key: 'hygrometrie',
            title: 'Hygrométrie + Température'
        },
        {
            key: 'kitchen',
            title: 'Matériel électrique cuisine'
        },
        {
            key: 'water',
            title: 'Eau (robinet, WC, Douche, Lavabo)'
        },
        {
            key: 'access',
            title: 'Nettoyage des accès (Entrée, Saut de Loup)'
        },
        {
            key: 'floor',
            title: 'Remplir les grilles de sol'
        },
        {
            key: 'generator',
            title: 'Faire tourner le générateur aux. 1H ou Moteurs de la Ventilation 15minutes'
        },
        {
            key: 'controllist',
            title: 'Remplir la fiche contrôle'
        },
        {
            key: 'dehumidifier',
            title: 'Contrôler déshumidificateur'
        },
        {
            key: 'gifas',
            title: 'Lampes Gifas/Contrôler'
        },
        {
            key: 'enveloppe',
            title: 'Contrôler l\'enveloppe de l\'Abri'
        },
        {
            key: 'joints',
            title: 'Contrôler l\'état des joints de Portes'
        },
        {
            key: 'chaussette',
            title: 'Contrôler les Chaussettes'
        }
    ];

    for (const section of sections) {
        const sectionElement = document.createElement('section');

        const h3 = document.createElement('h3');

        let status = '';
        if (construction[section.key] === 'ok') {
            status = '✅';
        } else if (construction[section.key] === 'torepair') {
            status = '❌';
        } else {
            status = '❓';
        }

        h3.innerHTML = section.title + ' ' + status;

        section.appendChild(h3);

        if (construction[section.key + 'Comments']) {
            const commentsP = document.createElement('p');

            commentsP.innerHTML = construction[section.key + 'Comments'];

            section.appendChild(commentsP);
        }

        main.appendChild(sectionElement);
    }

    console.log(construction);
}

getDetails();