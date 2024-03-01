import { Doc } from 'yjs'

const store: Doc[] = []

export function addDoc(doc: Doc) {
  store.push(doc)
}

export function removeDoc(doc: Doc) {
  const index = store.indexOf(doc)
  if (index > -1) {
    store.splice(index, 1)
  }
}

export function getDoc(docId: string) {
  return store.find(doc => doc.guid === docId)
}

export function getDocs() {
  return store
}

export function getDocIds() {
  return store.map(doc => doc.guid)
}

