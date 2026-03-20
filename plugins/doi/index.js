import { DLTHINGS, RDF, SKOS } from '@/modules/namespaces';
import { namespace } from 'shacl-tulip';
import { DataFactory } from 'n3';

const { namedNode, blankNode, literal, quad } = DataFactory;
const DCTERMS = namespace('http://purl.org/dc/terms/');
const OBO = namespace('http://purl.obolibrary.org/obo/');
const MARCREL = namespace('http://id.loc.gov/vocabulary/relators/');
const DOI_BASE = "https://doi.org/"
const XYZRI = namespace('https://concepts.datalad.org/s/demo-research-information/unreleased/');

export async function importMetadata(args) {
    const doi = args.doi;
    const rdfDS = args.rdfDS;
    try {
        let result = await fetchCSL(doi);
        const enrichedRecord = processRecord(result, rdfDS);
        return enrichedRecord
    } catch (error) {
        throw(error)
    }
}

async function fetchCSL(doi) {
    const endpoint = `${DOI_BASE}${doi}`
    const response = await fetch(endpoint, {
        headers: {
            Accept: "application/vnd.citationstyles.csl+json"
        }
    })
    if (!response.ok) {
        throw new Error(`DOI lookup failed ${response.status}`)
    }
    return await response.json()
}

async function fetchCitation(doi) {
    const endpoint = `${DOI_BASE}${doi}`
    const response = await fetch(endpoint, {
        headers: {
            Accept: "text/x-bibliography; style=apa"
        }
    })
    if (!response.ok) {
        return null
    }
    return await response.text()
}

function getAuthors(citeprocMetadata) {
    return citeprocMetadata.author ?? []
}

function getContributions(citeprocMetadata, rdfDS) {
    const authors = getAuthors(citeprocMetadata)
    const persons = [];
    const contributions = [];
    for (const auth of authors) {
        // if record has ORCID, try to find known Person with that identifier
        // if person found via ORCID, this is the pid to add to the object slot of attribution
        // if person not found: create new person record
        let attr = {
            roles: [getAuthorRole(auth)],
        }
        let person_pid
        let person_found_via
        if (auth['ORCID']) {
            person_pid = findRecordWithIdentifier(auth['ORCID'].replace('https://orcid.org/', ''), rdfDS)
            person_found_via = 'orcid'
        }
        attr['object'] = person_pid;
        contributions.push(attr)
        persons.push({
            pid: person_pid,
            given_name: auth['given'] ? auth['given'] : '',
            family_name: auth['family'] ? auth['family'] : '',
            role: getAuthorRole(auth),
            found_via: person_found_via,
        })
    }

    return {
        persons: persons,
        contributions: contributions,
    }
}

function findRecordWithIdentifier(notation, rdfDS) {

    let identifiers = rdfDS.data.graph.getQuads(
        null,
        namedNode(SKOS.notation.value),
        literal(notation),
        null
    ).map(q => q.subject);
    const records = identifiers.flatMap(id =>
        rdfDS.data.graph.getQuads(
            null,
            namedNode(DCTERMS.identifier.value),
            id,
            null
        ).map(q => q.subject)
    )
    if (records.length) {
        return records[0].value
    }
    return undefined
}

export function findPublicationWithDOI(doi, rdfDS) {
    // First try and find publication records with linked identifiers
    // Then try to find publications with DOI as PID
    let publication = findRecordWithIdentifier(doi, rdfDS)
    if (publication) {
        return publication
    } else {
        let pubPIDs = rdfDS.data.graph.getQuads(
            namedNode(`${DOI_BASE}${doi}`),
            namedNode(RDF.type.value),
            namedNode(XYZRI.XYZPublication.value),
            null
        ).map(q => q.subject);
        if (pubPIDs.length) {
            return pubPIDs[0].value;
        }
    }
    return undefined
}

function findPersonWithNames(givenName, familyName, rdfDS) {
    // persons with matching family name
    const familyMatches = rdfDS.data.graph.getQuads(
        null,
        namedNode(DLTHINGS.family_name.value),
        literal(familyName),
        null
    ).map(q => q.subject.value)
    // persons with matching given name
    const givenMatches = rdfDS.data.graph.getQuads(
        null,
        namedNode(DLTHINGS.given_name.value),
        literal(givenName),
        null
    ).map(q => q.subject.value)
    // intersection
    const persons = familyMatches.filter(p => givenMatches.includes(p))
    if (persons.length) {
        return persons[0]
    }
    return undefined
}

function getAuthorRole(author) {
    let seq = author['sequence']
    if (seq) {
        if (seq == 'first') {
            return OBO.MS_1002034.value;
        } else if (seq == 'additional') {
            return OBO.MS_1002036.value;
        } else {
            return MARCREL.aut.value;
        }
    }
    return MARCREL.aut.value;
}

function htmlDecode(input) {
  var doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
}

function getTitle(citeprocMetadata) {
    return citeprocMetadata.title ? htmlDecode(citeprocMetadata.title) : ''
}

function getAbstract(citeprocMetadata) {
    return citeprocMetadata.abstract ? htmlDecode(citeprocMetadata.abstract) : ''
}

function processRecord(citeprocMetadata, rdfDS) {
    // authors => attributed_to and persons
    // publishing activity (date / ISSN) => generated_by
    // licenses => rules
    const {persons, contributions} = getContributions(citeprocMetadata, rdfDS)
    const title = getTitle(citeprocMetadata, rdfDS)
    const abstract = getAbstract(citeprocMetadata, rdfDS)
    const pub = {
        attributed_to: contributions,
        generated_by: [],
        about: [],
        description: "",
        identifiers: [],
        pid:'',
        title:title,
    }
    return {
        authors: persons,
        title: title,
        abstract: abstract,
    }
}