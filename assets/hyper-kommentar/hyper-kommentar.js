function startHyperKommentar() {
  const containerElement = document.getElementById('hyper-kommentar');
  const pageId = containerElement.dataset.pageId;

  if (!pageId) {
    return;
  }

  const API_URL = 'https://worker-spike.shybyte.workers.dev';
  // const API_URL = 'http://localhost:8080';
  const API_COMMENTS_URL = `${API_URL}/pages/${pageId}/comments`;

  async function fetchComments() {
    const commentsResult = await fetch(API_COMMENTS_URL).then((r) => r.json());
    return commentsResult.data;
  }

  async function postComment(comment) {
    const postResult = await fetch(API_COMMENTS_URL, {
      method: 'POST',
      body: JSON.stringify(comment),
    }).then((r) => r.json());
    console.log('postResult', postResult);
    return postResult.data;
  }

  async function removeComment(commentId) {
    console.log('delete', commentId);
    await fetch(API_COMMENTS_URL + '/' + commentId, {
      method: 'DELETE',
    }).then((r) => r.json());
  }

  const state = async () => {
    return {
      comments: await fetchComments(),
      text: 'my fresh comment',
    };
  };

  const view = (state) => html`
    <div class="hyper-kommentar">
      <h2>Comments</h2>
      <ul>
        ${state.comments.map(
          (comment) =>
            html`
              <li>
                ${comment.text}
                <button
                  @click="${run((state) => {
                    console.log('del', comment);
                    removeComment(comment.id);
                    console.log('after del', comment);
                    return {
                      ...state,
                      comments: state.comments.filter(
                        (it) => it.id !== comment.id,
                      ),
                    };
                  })}"
                >
                  X
                </button>
              </li>
            `,
        )}
      </ul>

      <form @submit="${run(onSubmit)}">
        <textarea
          autofocus
          .value="${state.text}"
          @input="${run((state, event) => ({
            ...state,
            text: event.target.value,
          }))}"
        ></textarea>
        <button>Post</button>
      </form>

      <pre>${state.text}</pre>
    </div>
  `;

  function deleteComment(commentId) {}

  async function onSubmit(state, event) {
    event.preventDefault();
    const newComment = { text: state.text };
    const postedComment = await postComment(newComment);
    console.log('postedComment', postedComment);
    return { ...state, comments: [...state.comments, postedComment] };
  }

  app.start(containerElement, state, view);
}

startHyperKommentar();
