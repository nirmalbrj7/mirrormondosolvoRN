import ActionTypes from '../actions/actionTypes';

const wizardInitialState = {
  pages: [],
  pagesCount: undefined,
  currentPage: 0,
  isFirstPage: true,
  isLastPage: undefined,
};

export default function wizard(state = wizardInitialState, action) {
  switch (action.type) {
    /* ---*---*---*--- */

    case ActionTypes.SET_WIZARD_PAGES: {
      const pagesCount = action.pages.length;
      const isLastPage = pagesCount - 1 === 0;

      const newState = {
        pages: action.pages,
        currentPage: 0,
        pagesCount,
        isLastPage,
      };

      return Object.assign({}, state, newState);
    }

    /* ---*---*---*--- */

    case ActionTypes.JUMP_TO_WIZARD_PAGE: {
      const isFirstPage = action.page === 0;
      const isLastPage = state.pagesCount - 1 === action.page;

      const newState = {
        currentPage: action.page,
        isFirstPage,
        isLastPage,
      };

      return Object.assign({}, state, newState);
    }

    /* ---*---*---*--- */

    default:
      return state;
  }
}
