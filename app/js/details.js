console.log('details');

async function getDetails() {
    let searchParams = new URLSearchParams(location.search);
    const getEntityResponse = await fetch('/api/ChecklistReportTrigger?partitionKey=' +
        searchParams.get('partitionKey') + '&rowKey=' +
        searchParams.get('rowKey')
    );
    const construction = await getEntityResponse.json();
    console.log(construction);
}

getDetails();