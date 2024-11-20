import Loader from './Loader';
import GridSearchList from './GridSearchList';

type SearchResultsProps = {
  isSearchFetching: boolean;
  searchedItems: any;
  type: 'post' | 'user';
};

const SearchResult = ({
  isSearchFetching,
  searchedItems,
  type,
}: SearchResultsProps) => {
  if (isSearchFetching) {
    return <Loader />;
  } else if (searchedItems && searchedItems.documents.length > 0) {
    return <GridSearchList items={searchedItems.documents} type={type} />;
  } else {
    return (
      <p className="text-light-4 mt-10 text-center w-full">No results found</p>
    );
  }
};

export default SearchResult;
