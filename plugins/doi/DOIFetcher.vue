<template>

    <v-row align="stretch">
        <v-col cols="10">
            <v-text-field v-model="doiText" label="DOI" variant="outlined" density="compact"></v-text-field>
            <v-card v-if="showError" flat style="margin-top: 0">
                <v-card-text>
                    <v-icon color="error">mdi-alert</v-icon> <em>{{ errorTitle }}:</em> {{ errorMessage }}
                    <v-btn @click="clearError" density="compact">Ok</v-btn>
                </v-card-text>
            </v-card>
        </v-col>
        <v-col>
            <v-btn @click="checkThenImportMetadata">Import</v-btn>
        </v-col>
    </v-row>

    <v-card flat variant="text" v-if="modelVals['title'] && modelVals['authors']">
        <h2>Imported metadata</h2>
        <br>
        <h3>Title</h3>
        <v-text-field
            variant="outlined"
            v-model="modelVals['title']" 
            density="compact">
        </v-text-field>
        <h3>Abstract</h3>
        <v-textarea
            variant="outlined"
            v-model="modelVals['abstract']" 
            density="compact">
        </v-textarea>
        <h3>Authors</h3>
        <v-card-text>
            <span v-if="modelVals['authors'].length">
                <v-row>
                    <v-col cols="2"><strong>Given Name</strong></v-col>
                    <v-col cols="2"><strong>Family Name</strong></v-col>
                    <v-col cols="3"><strong>Role</strong></v-col>
                    <v-col cols="3" class="d-flex justify-center align-center"><strong>Linked Record</strong></v-col>
                    <v-col cols="1" class="d-flex justify-center align-center"><strong>Type</strong></v-col>
                    <v-col></v-col>
                </v-row>
                <v-divider opacity=".7" thickness="1" style="margin-top: 1em; margin-bottom: 1em"></v-divider>
                <v-row
                    no-gutters align="center" class="author-row"
                    v-for="(a, idx) in modelVals['authors']" 
                    :disabled="a.type == 'matched'"
                    :class="a.type == 'matched' ? 'author-matched': ''"
                    :key="a.row_key"
                >
                    <v-col cols="2">
                        <v-text-field
                            variant="outlined"
                            v-model="a.given_name" 
                            density="compact"
                            hide-details="auto"
                            :disabled="a.type == 'matched'"
                        />
                    </v-col>
                    <v-col cols="2">
                        <v-text-field
                            variant="outlined"
                            v-model="a.family_name" 
                            density="compact"
                            hide-details="auto"
                            :disabled="a.type == 'matched'"
                        />
                    </v-col>
                    <v-col cols="3">
                        <InstancesSelectEditor4Wiz
                            v-model="a.role"
                            :property_shape="prop_shape_role"
                            :allow_add="false"
                            :disabled="a.type == 'matched'"
                        />
                    </v-col>
                    <v-col cols="3">
                        <InstancesSelectEditor4Wiz
                            v-model="a.pid"
                            :property_shape="prop_shape_person"
                            :allow_add="false"
                            :disabled="a.type == 'matched'"
                        />
                    </v-col>
                    <v-col cols="1" class="d-flex justify-center align-center">
                        <span v-if="a.type == 'matched'">
                            <v-tooltip text="Matched">
                                <template v-slot:activator="{ props }">
                                    <v-icon v-bind="props" color="success">mdi-check-all</v-icon>
                                </template>
                            </v-tooltip>
                        </span>
                        <span v-else-if="a.type == 'new' && a.pid">
                            <v-tooltip text="Selected">
                                <template v-slot:activator="{ props }">
                                    <v-icon v-bind="props">mdi-account-check</v-icon>
                                </template>
                            </v-tooltip>
                        </span>
                        <span v-else>
                            <v-tooltip text="New">
                                <template v-slot:activator="{ props }">
                                    <v-icon v-bind="props">mdi-account</v-icon>
                                </template>
                            </v-tooltip>
                        </span>
                    </v-col>
                    <v-col>
                        <v-btn variant="text" icon="mdi-trash-can" @click="removeAuthor(idx)"></v-btn>
                    </v-col>
                </v-row>
                <br>

                <v-btn
                @click="addAuthor()"
                prepend-icon="mdi-plus"
                density="compact"
                >Add author</v-btn>
            </span>
        </v-card-text>
    </v-card>    
</template>

<script setup>
import { ref, inject, toRaw, onMounted, watch} from 'vue'
import { SHACL } from '@/modules/namespaces';
import InstancesSelectEditor4Wiz from '@/components/InstancesSelectEditor4Wiz.vue';
import { namespace } from 'shacl-tulip';
const XYZRI = namespace('https://concepts.datalad.org/s/demo-research-information/unreleased/');

const props = defineProps({
    config: Object,
    disabled: Boolean,
});

const modelVals = defineModel('modelVals')
const emit = defineEmits(['uploadComplete', 'init-form'])
const plugins = inject('runtimePlugins')
const fetchFromService = inject('fetchFromService')
const allPrefixes = inject('allPrefixes')

const rdfDS = inject('rdfDS')
const doiText = ref('')
const prop_shape_person = {
    [SHACL.class.value]: XYZRI.XYZPerson.value,
    [SHACL.nodeKind.value]: SHACL.IRI.value,
    [SHACL.path.value]:'',
    [SHACL.description.value]:'',
}
const prop_shape_role = {
    [SHACL.class.value]: XYZRI.XYZAgentRole.value,
    [SHACL.nodeKind.value]: SHACL.IRI.value,
    [SHACL.path.value]:'',
    [SHACL.description.value]:'',
}
const showError = ref(false);
const errorTitle = ref('');
const errorMessage = ref('');
onMounted(() => {

})

function clearError() {
    showError.value = false;
    errorTitle.value = '';
    errorMessage.value = '';
}

function loadError(title, message) {
    showError.value = true;
    errorTitle.value = title;
    errorMessage.value = message;
}

function addAuthor() {
    modelVals.value['authors'].push(
        {
            pid: null,
            given_name: null,
            family_name: null,
            role: null,
            row_key: crypto.randomUUID(),
        }
    )
}

function removeAuthor(idx) {
    modelVals.value['authors'].splice(idx,1)
}

async function checkThenImportMetadata() {
    // First check if a publication with the doi is already in the pool
    // if so: instruct user to rather edit the existing record

    // First do a constrained fetch for all publication records referencing the doi
    const result = await fetchFromService(
        'get-paginated-records-constrained',
        XYZRI.XYZPublication.value,
        allPrefixes,
        doiText.value
    );
    if (result.status === null) {
        console.error(result.error);
    }
    // Now we find a publication with said DOI, either in identifiers or as pid
    let pub = await plugins['doi'].api.findPublicationWithDOI(doiText.value, rdfDS)
    if (pub) {
        let title = 'Known DOI'
        let message = `A publication record with the specified DOI (${doiText.value}) already exists in the knowledge base. Please edit the existing record rather than importing a new one.`
        loadError(title, message)
        return
    }
    // Otherwise we continue
    importMetadata()
}

// Validate file type and read it
const importMetadata = async () => {
    clearError()
    emit('init-form')
    try {
        let result = await plugins['doi'].api.importMetadata(
            {
                doi: doiText.value,
                rdfDS: rdfDS,
            }
        )
        modelVals.value['authors'] = result.authors;
        modelVals.value['title'] = result.title;
        modelVals.value['abstract'] = result.abstract;
        modelVals.value['doi'] = doiText.value;
        for (const a of modelVals.value['authors']) {
            if (a.pid) {
                 a.type = 'matched';
            } else {
                 a.type = 'new';
            }
            a.row_key = a.given_name+a.family_name;
        }
    } catch (error) {
        let title = 'DOI Fetch Error'
        let message = error
        loadError(title, message)
        console.error(error)
    }
}


</script>

<style scoped>

.author-row:hover {
    background-color: #7f7d7de5;
    align-items: center;
}
.author-matched {
    background-color: #7f7d7de5;
}
</style>
